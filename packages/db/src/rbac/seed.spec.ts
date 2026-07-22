import {
  defaultRoles,
  platformPermissions,
  type PermissionDefinition,
} from './catalogue';
import {
  seedRbacWithStore,
  type RbacSeedStore,
  type SeedPermissionRecord,
  type SeedRoleRecord,
} from './seed';

class InMemoryRbacSeedStore implements RbacSeedStore {
  readonly permissions = new Map<string, SeedPermissionRecord>();
  readonly roles = new Map<string, SeedRoleRecord>();
  readonly grants = new Map<string, Set<string>>();
  readonly permissionChanges: string[] = [];

  constructor(private readonly organizationIds: readonly string[]) {}

  async ensurePermissions(
    definitions: readonly PermissionDefinition[],
  ): Promise<readonly SeedPermissionRecord[]> {
    for (const definition of definitions) {
      this.permissions.set(definition.key, {
        id: `permission:${definition.key}`,
        key: definition.key,
      });
    }
    return definitions.map(({ key }) => {
      const permission = this.permissions.get(key);
      if (!permission) {
        throw new Error(`Missing test permission: ${key}`);
      }
      return permission;
    });
  }

  async ensureRoles(
    organizationId: string,
    definitions: typeof defaultRoles,
  ): Promise<readonly SeedRoleRecord[]> {
    for (const definition of definitions) {
      const compoundKey = `${organizationId}:${definition.key}`;
      this.roles.set(compoundKey, {
        id: `role:${compoundKey}`,
        key: definition.key,
      });
    }
    return definitions.map(({ key }) =>
      this.roles.get(`${organizationId}:${key}`),
    ) as SeedRoleRecord[];
  }

  async reconcilePlatformGrants(
    roleId: string,
    platformPermissionIds: readonly string[],
    grantedPermissionIds: readonly string[],
  ): Promise<boolean> {
    const grants = this.grants.get(roleId) ?? new Set<string>();
    const before = [...grants].sort();
    const platformIds = new Set(platformPermissionIds);
    for (const permissionId of grants) {
      if (
        platformIds.has(permissionId) &&
        !grantedPermissionIds.includes(permissionId)
      ) {
        grants.delete(permissionId);
      }
    }
    for (const permissionId of grantedPermissionIds) {
      grants.add(permissionId);
    }
    this.grants.set(roleId, grants);
    return JSON.stringify(before) !== JSON.stringify([...grants].sort());
  }

  async recordPermissionChange(
    organizationId: string,
    role: SeedRoleRecord,
  ): Promise<void> {
    this.permissionChanges.push(`${organizationId}:${role.key}`);
  }

  async listOrganizationIds(): Promise<readonly string[]> {
    return this.organizationIds;
  }
}

describe('RBAC seed', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function firstOrganization(
    result: Awaited<ReturnType<typeof seedRbacWithStore>>,
  ) {
    const organization = result.organizations[0];
    if (!organization) {
      throw new Error('Expected the test organization to be seeded.');
    }
    return organization;
  }

  it('creates the platform permissions and default roles', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);

    const result = await seedRbacWithStore(store, now);

    expect(store.permissions.size).toBe(platformPermissions.length);
    expect([...store.permissions.keys()]).toEqual(
      platformPermissions.map(({ key }) => key),
    );
    expect(store.roles.size).toBe(defaultRoles.length);
    expect(result.organizations[0]?.roles).toMatchObject({
      owner: { key: 'owner' },
      admin: { key: 'admin' },
      member: { key: 'member' },
    });
  });

  it('is idempotent when executed repeatedly', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);

    await seedRbacWithStore(store, now);
    const firstState = {
      permissionCount: store.permissions.size,
      roleCount: store.roles.size,
      grants: [...store.grants.entries()].map(([roleId, grants]) => [
        roleId,
        [...grants],
      ]),
      permissionChanges: [...store.permissionChanges],
    };
    await seedRbacWithStore(store, now);

    expect({
      permissionCount: store.permissions.size,
      roleCount: store.roles.size,
      grants: [...store.grants.entries()].map(([roleId, grants]) => [
        roleId,
        [...grants],
      ]),
      permissionChanges: [...store.permissionChanges],
    }).toEqual(firstState);
  });

  it('records permission changes only when platform grants change', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);

    await seedRbacWithStore(store, now);
    await seedRbacWithStore(store, now);

    expect(store.permissionChanges).toEqual([
      'organization-a:owner',
      'organization-a:admin',
      'organization-a:member',
    ]);
  });

  it('grants every platform permission to Owner', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);
    const result = await seedRbacWithStore(store, now);
    const owner = firstOrganization(result).roles.owner;

    expect(store.grants.get(owner.id)).toEqual(
      new Set(platformPermissions.map(({ key }) => `permission:${key}`)),
    );
  });

  it('keeps ownership-sensitive organization management out of Admin', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);
    const result = await seedRbacWithStore(store, now);
    const admin = firstOrganization(result).roles.admin;
    const adminGrants = store.grants.get(admin.id);

    expect(adminGrants).toContain('permission:organization.update');
    expect(adminGrants).toContain('permission:permissions.manage');
    expect(adminGrants).not.toContain('permission:organization.manage');
  });

  it('does not grant administrative permissions to Member', async () => {
    const store = new InMemoryRbacSeedStore(['organization-a']);
    const result = await seedRbacWithStore(store, now);
    const member = firstOrganization(result).roles.member;
    const memberGrants = store.grants.get(member.id);

    expect(memberGrants).toContain('permission:workspace.read');
    expect(memberGrants).not.toContain('permission:workspace.manage');
    expect(memberGrants).not.toContain('permission:organization.update');
    expect(memberGrants).not.toContain('permission:permissions.manage');
  });
});
