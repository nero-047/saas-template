import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import type { ContextRequest } from './context-request';
import { RequestContextService } from './request-context.service';
import {
  OrganizationContextGuard,
  WorkspaceContextGuard,
} from './tenant-context.guards';
import { TenantContextService } from './tenant-context.service';

const organizationId = '11111111-1111-4111-8111-111111111111';
const workspaceId = '22222222-2222-4222-8222-222222222222';

function executionContext(request: ContextRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('tenant context guards', () => {
  const requestContext = new RequestContextService();
  const tenants = {
    resolveOrganization: jest.fn(),
    resolveWorkspace: jest.fn(),
  };
  const organizationGuard = new OrganizationContextGuard(
    requestContext,
    tenants as unknown as TenantContextService,
  );
  const workspaceGuard = new WorkspaceContextGuard(
    requestContext,
    tenants as unknown as TenantContextService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves organization membership and permissions into request context', async () => {
    const request = {
      headers: { 'x-organization-id': organizationId },
    } as unknown as ContextRequest;
    const organizationContext = {
      currentUser: { id: 'user-id', sessionId: 'session-id' },
      organization: { id: organizationId },
      membership: { id: 'membership-id', workspaceId: null },
    };
    tenants.resolveOrganization.mockResolvedValue({
      context: organizationContext,
      permissions: ['workspace.read'],
    });

    await requestContext.run(request, async () => {
      requestContext.setAuthenticatedUser({
        id: 'user-id',
        sessionId: 'session-id',
      });

      await expect(
        organizationGuard.canActivate(executionContext(request)),
      ).resolves.toBe(true);
      expect(request.organizationContext).toBe(organizationContext);
      expect(requestContext.requireOrganization()).toEqual(
        expect.objectContaining({
          organizationId,
          permissions: ['workspace.read'],
        }),
      );
    });
  });

  it('rejects organization resolution before database access when unauthenticated', async () => {
    const request = {
      headers: { 'x-organization-id': organizationId },
    } as unknown as ContextRequest;

    await requestContext.run(request, async () => {
      await expect(
        organizationGuard.canActivate(executionContext(request)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(tenants.resolveOrganization).not.toHaveBeenCalled();
    });
  });

  it('keeps workspace resolution inside the selected organization', async () => {
    const organizationContext = {
      currentUser: { id: 'user-id', sessionId: 'session-id' },
      organization: { id: organizationId },
      membership: { id: 'organization-membership-id' },
    };
    const request = {
      headers: { 'x-workspace-id': workspaceId },
      organizationContext,
    } as unknown as ContextRequest;
    const workspaceContext = {
      organizationContext,
      workspace: { id: workspaceId, organizationId },
      membership: { id: 'workspace-membership-id' },
    };
    tenants.resolveWorkspace.mockResolvedValue({
      context: workspaceContext,
      permissions: ['workspace.update'],
    });

    await requestContext.run(request, async () => {
      requestContext.setAuthenticatedUser({
        id: 'user-id',
        sessionId: 'session-id',
      });
      requestContext.setOrganization(organizationId, ['organization.read']);

      await expect(
        workspaceGuard.canActivate(executionContext(request)),
      ).resolves.toBe(true);
      expect(tenants.resolveWorkspace).toHaveBeenCalledWith(
        organizationContext,
        workspaceId,
      );
      expect(requestContext.requireWorkspace()).toEqual(
        expect.objectContaining({
          organizationId,
          workspaceId,
          permissions: ['workspace.update'],
        }),
      );
    });
  });

  it('does not establish workspace context when isolation checks fail', async () => {
    const organizationContext = {
      currentUser: { id: 'user-id', sessionId: 'session-id' },
      organization: { id: organizationId },
      membership: { id: 'membership-id' },
    };
    const request = {
      headers: { 'x-workspace-id': workspaceId },
      organizationContext,
    } as unknown as ContextRequest;
    tenants.resolveWorkspace.mockRejectedValue(
      new ForbiddenException('Workspace access is not permitted.'),
    );

    await requestContext.run(request, async () => {
      requestContext.setAuthenticatedUser({
        id: 'user-id',
        sessionId: 'session-id',
      });
      requestContext.setOrganization(organizationId, []);

      await expect(
        workspaceGuard.canActivate(executionContext(request)),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(requestContext.get().workspaceId).toBeUndefined();
    });
  });
});
