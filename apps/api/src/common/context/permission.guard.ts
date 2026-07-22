import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsService } from '../../modules/permissions/permissions.service';
import { RequestContextService } from './request-context.service';

export const REQUIRED_PERMISSIONS = Symbol('required-permissions');

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContext: RequestContextService,
    private readonly permissions: PermissionsService,
  ) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly string[]>(
      REQUIRED_PERMISSIONS,
      [executionContext.getHandler(), executionContext.getClass()],
    );
    if (!required) {
      return true;
    }

    const context = this.requestContext.requireAuthenticated();
    this.permissions.assertCan(context, required);
    return true;
  }
}

export function RequirePermissions(...permissions: string[]) {
  const required = permissions.map((permission) => permission.trim());
  if (required.length === 0 || required.some((permission) => !permission)) {
    throw new Error('RequirePermissions needs at least one permission key.');
  }
  return SetMetadata(REQUIRED_PERMISSIONS, required);
}
