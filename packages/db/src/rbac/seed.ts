import { and, asc, eq, inArray, notInArray, sql } from 'drizzle-orm';

import { PLATFORM_AUDIT_ACTIONS } from '../audit/catalogue.js';
import type { Database } from '../client.js';
import { auditLogs } from '../schema/audit-logs.js';
import { organizations } from '../schema/organizations.js';
import { permissions, rolePermissions } from '../schema/permissions.js';
import { roles } from '../schema/roles.js';
import {
  defaultRoles,
  platformPermissions,
  type DefaultRoleKey,
  type PermissionDefinition,
} from './catalogue.js';

export interface SeedPermissionRecord {
  readonly id: string;
  readonly key: string;
}

export interface SeedRoleRecord {
  readonly id: string;
  readonly key: string;
}

export interface RbacSeedStore {
  ensurePermissions(
    definitions: readonly PermissionDefinition[],
    now: Date,
  ): Promise<readonly SeedPermissionRecord[]>;
  ensureRoles(
    organizationId: string,
    definitions: typeof defaultRoles,
    now: Date,
  ): Promise<readonly SeedRoleRecord[]>;
  reconcilePlatformGrants(
    roleId: string,
    platformPermissionIds: readonly string[],
    grantedPermissionIds: readonly string[],
    now: Date,
  ): Promise<boolean>;
  recordPermissionChange(
    organizationId: string,
    role: SeedRoleRecord,
    permissionKeys: readonly string[],
    now: Date,
  ): Promise<void>;
  listOrganizationIds(): Promise<readonly string[]>;
}

export interface SeededOrganizationRoles {
  readonly organizationId: string;
  readonly roles: Readonly<Record<DefaultRoleKey, SeedRoleRecord>>;
}

export interface RbacSeedResult {
  readonly permissionCount: number;
  readonly organizations: readonly SeededOrganizationRoles[];
}

function requiredRecord<T extends { readonly key: string }>(
  records: ReadonlyMap<string, T>,
  key: string,
): T {
  const record = records.get(key);
  if (!record) {
    throw new Error(`RBAC seed could not resolve required key: ${key}`);
  }
  return record;
}

async function seedRolesForOrganization(
  store: RbacSeedStore,
  organizationId: string,
  permissionRecords: readonly SeedPermissionRecord[],
  now: Date,
): Promise<SeededOrganizationRoles> {
  const permissionByKey = new Map(
    permissionRecords.map((permission) => [permission.key, permission]),
  );
  const roleRecords = await store.ensureRoles(
    organizationId,
    defaultRoles,
    now,
  );
  const roleByKey = new Map(roleRecords.map((role) => [role.key, role]));
  const platformPermissionIds = platformPermissions.map(
    ({ key }) => requiredRecord(permissionByKey, key).id,
  );

  for (const definition of defaultRoles) {
    const role = requiredRecord(roleByKey, definition.key);
    const grantedPermissionIds = definition.permissions.map(
      (key) => requiredRecord(permissionByKey, key).id,
    );
    const changed = await store.reconcilePlatformGrants(
      role.id,
      platformPermissionIds,
      grantedPermissionIds,
      now,
    );
    if (changed) {
      await store.recordPermissionChange(
        organizationId,
        role,
        definition.permissions,
        now,
      );
    }
  }

  return {
    organizationId,
    roles: {
      owner: requiredRecord(roleByKey, 'owner'),
      admin: requiredRecord(roleByKey, 'admin'),
      member: requiredRecord(roleByKey, 'member'),
    },
  };
}

export async function seedOrganizationRbacWithStore(
  store: RbacSeedStore,
  organizationId: string,
  now: Date = new Date(),
): Promise<SeededOrganizationRoles> {
  const permissionRecords = await store.ensurePermissions(
    platformPermissions,
    now,
  );
  return seedRolesForOrganization(
    store,
    organizationId,
    permissionRecords,
    now,
  );
}

export async function seedRbacWithStore(
  store: RbacSeedStore,
  now: Date = new Date(),
): Promise<RbacSeedResult> {
  const permissionRecords = await store.ensurePermissions(
    platformPermissions,
    now,
  );
  const organizationIds = await store.listOrganizationIds();
  const seededOrganizations: SeededOrganizationRoles[] = [];

  for (const organizationId of organizationIds) {
    seededOrganizations.push(
      await seedRolesForOrganization(
        store,
        organizationId,
        permissionRecords,
        now,
      ),
    );
  }

  return {
    permissionCount: permissionRecords.length,
    organizations: seededOrganizations,
  };
}

type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];

class DrizzleRbacSeedStore implements RbacSeedStore {
  constructor(private readonly database: DatabaseTransaction) {}

  async ensurePermissions(
    definitions: readonly PermissionDefinition[],
    now: Date,
  ): Promise<readonly SeedPermissionRecord[]> {
    return this.database
      .insert(permissions)
      .values(
        definitions.map((definition) => ({
          ...definition,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          description: sql`excluded.description`,
          updatedAt: now,
        },
      })
      .returning({ id: permissions.id, key: permissions.key });
  }

  async ensureRoles(
    organizationId: string,
    definitions: typeof defaultRoles,
    now: Date,
  ): Promise<readonly SeedRoleRecord[]> {
    return this.database
      .insert(roles)
      .values(
        definitions.map(({ key, name, description }) => ({
          organizationId,
          key,
          name,
          description,
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [roles.organizationId, roles.key],
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          isSystem: true,
          updatedAt: now,
        },
      })
      .returning({ id: roles.id, key: roles.key });
  }

  async reconcilePlatformGrants(
    roleId: string,
    platformPermissionIds: readonly string[],
    grantedPermissionIds: readonly string[],
    now: Date,
  ): Promise<boolean> {
    let removedCount = 0;
    if (platformPermissionIds.length > grantedPermissionIds.length) {
      const removed = await this.database
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            inArray(rolePermissions.permissionId, [...platformPermissionIds]),
            notInArray(rolePermissions.permissionId, [...grantedPermissionIds]),
          ),
        )
        .returning({ permissionId: rolePermissions.permissionId });
      removedCount = removed.length;
    }

    const added = await this.database
      .insert(rolePermissions)
      .values(
        grantedPermissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          createdAt: now,
        })),
      )
      .onConflictDoNothing({
        target: [rolePermissions.roleId, rolePermissions.permissionId],
      })
      .returning({ permissionId: rolePermissions.permissionId });

    return removedCount > 0 || added.length > 0;
  }

  async recordPermissionChange(
    organizationId: string,
    role: SeedRoleRecord,
    permissionKeys: readonly string[],
    now: Date,
  ): Promise<void> {
    await this.database.insert(auditLogs).values({
      organizationId,
      action: PLATFORM_AUDIT_ACTIONS.PERMISSION_CHANGED,
      resourceType: 'role',
      resourceId: role.id,
      metadata: { roleKey: role.key, permissionKeys },
      createdAt: now,
    });
  }

  async listOrganizationIds(): Promise<readonly string[]> {
    const records = await this.database
      .select({ id: organizations.id })
      .from(organizations)
      .orderBy(asc(organizations.id));
    return records.map(({ id }) => id);
  }
}

export async function seedOrganizationRbac(
  transaction: DatabaseTransaction,
  organizationId: string,
  now: Date = new Date(),
): Promise<SeededOrganizationRoles> {
  return seedOrganizationRbacWithStore(
    new DrizzleRbacSeedStore(transaction),
    organizationId,
    now,
  );
}

export async function seedRbac(
  database: Database,
  now: Date = new Date(),
): Promise<RbacSeedResult> {
  return database.transaction((transaction) =>
    seedRbacWithStore(new DrizzleRbacSeedStore(transaction), now),
  );
}
