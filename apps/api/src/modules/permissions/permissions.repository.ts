import { Injectable } from '@nestjs/common';
import {
  and,
  eq,
  membershipRoles,
  permissions,
  rolePermissions,
  roles,
} from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByKey(key: string) {
    const [permission] = await this.database.db
      .select()
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);
    return permission;
  }

  async findKeysForMembership(membershipId: string): Promise<string[]> {
    const rows = await this.database.db
      .select({ key: permissions.key })
      .from(membershipRoles)
      .innerJoin(
        roles,
        and(
          eq(roles.id, membershipRoles.roleId),
          eq(roles.organizationId, membershipRoles.organizationId),
        ),
      )
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(membershipRoles.membershipId, membershipId));

    return rows.map(({ key }) => key);
  }
}
