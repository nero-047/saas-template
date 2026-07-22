import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Permission } from '@saas-template/db';

import { PermissionsRepository } from './permissions.repository';

export interface PermissionContext {
  readonly membershipId: string;
}

export interface PermissionSubject {
  readonly permissions?: readonly string[];
}

@Injectable()
export class PermissionsService {
  constructor(private readonly permissions: PermissionsRepository) {}

  async forMembership(membershipId: string): Promise<readonly string[]> {
    return [
      ...new Set(await this.permissions.findKeysForMembership(membershipId)),
    ];
  }

  async resolveByKey(key: string): Promise<Permission | undefined> {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      return undefined;
    }
    return this.permissions.findByKey(normalizedKey);
  }

  async canKnownPermission(
    subject: PermissionSubject | undefined,
    requiredPermission: string,
  ): Promise<boolean> {
    const permission = await this.resolveByKey(requiredPermission);
    return permission ? this.can(subject, permission.key) : false;
  }

  can(
    subject: PermissionSubject | undefined,
    requiredPermission: string,
  ): boolean {
    if (!subject?.permissions || !requiredPermission) {
      return false;
    }
    return new Set(subject.permissions).has(requiredPermission);
  }

  assertCan(
    subject: PermissionSubject | undefined,
    requiredPermissions: string | readonly string[],
  ): void {
    const required =
      typeof requiredPermissions === 'string'
        ? [requiredPermissions]
        : requiredPermissions;
    if (
      required.length === 0 ||
      !required.every((permission) => this.can(subject, permission))
    ) {
      throw new ForbiddenException('Permission denied.');
    }
  }

  async hasPermission(
    context: PermissionContext,
    requiredPermission: string,
  ): Promise<boolean> {
    const granted = await this.forMembership(context.membershipId);
    return this.can({ permissions: granted }, requiredPermission);
  }

  async assertPermission(
    context: PermissionContext,
    requiredPermission: string,
  ): Promise<void> {
    const granted = await this.forMembership(context.membershipId);
    this.assertCan({ permissions: granted }, requiredPermission);
  }
}
