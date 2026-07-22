import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsService } from '../../modules/permissions/permissions.service';
import { PermissionGuard } from './permission.guard';
import { RequestContextService } from './request-context.service';

describe('PermissionGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const requestContext = { requireAuthenticated: jest.fn() };
  const permissions = { assertCan: jest.fn() };
  const guard = new PermissionGuard(
    reflector as unknown as Reflector,
    requestContext as unknown as RequestContextService,
    permissions as unknown as PermissionsService,
  );
  const executionContext = {
    getHandler: () =>
      function handler() {
        return undefined;
      },
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enforces every permission declared by the route', () => {
    const context = {
      userId: 'user-id',
      sessionId: 'session-id',
      permissions: ['workspace.read', 'workspace.update'],
    };
    reflector.getAllAndOverride.mockReturnValue([
      'workspace.read',
      'workspace.update',
    ]);
    requestContext.requireAuthenticated.mockReturnValue(context);

    expect(guard.canActivate(executionContext)).toBe(true);
    expect(permissions.assertCan).toHaveBeenCalledWith(context, [
      'workspace.read',
      'workspace.update',
    ]);
  });

  it('propagates default-deny permission failures', () => {
    reflector.getAllAndOverride.mockReturnValue(['workspace.update']);
    requestContext.requireAuthenticated.mockReturnValue({
      userId: 'user-id',
      sessionId: 'session-id',
      permissions: [],
    });
    permissions.assertCan.mockImplementation(() => {
      throw new ForbiddenException('Permission denied.');
    });

    expect(() => guard.canActivate(executionContext)).toThrow(
      ForbiddenException,
    );
  });

  it('does not claim a permission requirement when metadata is absent', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(executionContext)).toBe(true);
    expect(requestContext.requireAuthenticated).not.toHaveBeenCalled();
  });
});
