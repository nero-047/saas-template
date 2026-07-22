import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type { ContextCarrierRequest } from './request-context';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  const context = new RequestContextService();

  it('creates authenticated, organization, workspace, and permission context', () => {
    const request: ContextCarrierRequest = {};

    context.run(request, () => {
      const requestId = context.get().requestId;
      expect(context.get()).toEqual({ requestId, permissions: [] });

      context.setAuthenticatedUser({ id: 'user-id', sessionId: 'session-id' });
      context.setOrganization('organization-id', [
        'workspace.read',
        'workspace.read',
      ]);
      context.setWorkspace('workspace-id', ['workspace.update']);

      expect(context.requireWorkspace()).toEqual({
        requestId,
        userId: 'user-id',
        sessionId: 'session-id',
        organizationId: 'organization-id',
        workspaceId: 'workspace-id',
        permissions: ['workspace.update'],
      });
      expect(request.requestContext).toEqual(
        expect.objectContaining({ organizationId: 'organization-id' }),
      );
    });
  });

  it('rejects missing authentication and tenant scopes by default', () => {
    context.run({}, () => {
      expect(() => context.requireAuthenticated()).toThrow(
        UnauthorizedException,
      );

      context.setAuthenticatedUser({ id: 'user-id', sessionId: 'session-id' });
      expect(() => context.requireOrganization()).toThrow(ForbiddenException);

      context.setOrganization('organization-id', []);
      expect(() => context.requireWorkspace()).toThrow(ForbiddenException);
    });
  });

  it('does not expose a context outside the request lifecycle', () => {
    expect(() => context.get()).toThrow(InternalServerErrorException);
  });

  it('isolates concurrent asynchronous requests', async () => {
    const first = context.run({}, async () => {
      context.setAuthenticatedUser({ id: 'first-user', sessionId: 'first' });
      await Promise.resolve();
      return context.requireAuthenticated().userId;
    });
    const second = context.run({}, async () => {
      context.setAuthenticatedUser({ id: 'second-user', sessionId: 'second' });
      await Promise.resolve();
      return context.requireAuthenticated().userId;
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      'first-user',
      'second-user',
    ]);
  });

  it('preserves an assigned request ID across asynchronous operations', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';

    await context.run(
      {},
      async () => {
        await Promise.resolve();
        expect(context.get().requestId).toBe(requestId);
      },
      requestId,
    );
  });
});
