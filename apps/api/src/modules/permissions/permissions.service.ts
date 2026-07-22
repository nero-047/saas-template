import { ForbiddenException, Injectable } from '@nestjs/common';

import { PermissionsRepository } from './permissions.repository';

export interface PermissionContext {
  readonly membershipId: string;
}

@Injectable()
export class PermissionsService {
  constructor(private readonly permissions: PermissionsRepository) {}

  async hasPermission(
    context: PermissionContext,
    requiredPermission: string,
  ): Promise<boolean> {
    const granted = await this.permissions.findKeysForMembership(
      context.membershipId,
    );
    return new Set(granted).has(requiredPermission);
  }

  async assertPermission(
    context: PermissionContext,
    requiredPermission: string,
  ): Promise<void> {
    if (!(await this.hasPermission(context, requiredPermission))) {
      throw new ForbiddenException('Permission denied.');
    }
  }
}
