import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type { CurrentUser as AuthenticatedUser } from '../../modules/auth/current-user';
import type {
  AuthenticatedRequestContext,
  ContextCarrierRequest,
  MutableRequestContext,
  OrganizationRequestContext,
  RequestContext,
  WorkspaceRequestContext,
} from './request-context';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<MutableRequestContext>();

  run<T>(
    request: ContextCarrierRequest,
    callback: () => T,
    requestId: string = randomUUID(),
  ): T {
    const context: MutableRequestContext = { requestId, permissions: [] };
    request.requestContext = context;
    return this.storage.run(context, callback);
  }

  get(): RequestContext {
    const context = this.requireStore();
    return { ...context, permissions: [...context.permissions] };
  }

  getOptional(): RequestContext | undefined {
    const context = this.storage.getStore();
    return context
      ? { ...context, permissions: [...context.permissions] }
      : undefined;
  }

  setAuthenticatedUser(user: AuthenticatedUser): void {
    const context = this.requireStore();
    context.userId = user.id;
    context.sessionId = user.sessionId;
    context.organizationId = undefined;
    context.workspaceId = undefined;
    context.permissions = [];
  }

  setOrganization(
    organizationId: string,
    permissions: readonly string[],
  ): void {
    const context = this.requireAuthenticated();
    const store = this.requireStore();
    store.userId = context.userId;
    store.sessionId = context.sessionId;
    store.organizationId = organizationId;
    store.workspaceId = undefined;
    store.permissions = [...new Set(permissions)];
  }

  setWorkspace(workspaceId: string, permissions: readonly string[]): void {
    this.requireOrganization();
    const context = this.requireStore();
    context.workspaceId = workspaceId;
    context.permissions = [...new Set(permissions)];
  }

  requireAuthenticated(): AuthenticatedRequestContext {
    const context = this.get();
    if (!context.userId || !context.sessionId) {
      throw new UnauthorizedException('Authentication is required.');
    }
    return context as AuthenticatedRequestContext;
  }

  requireOrganization(): OrganizationRequestContext {
    const context = this.requireAuthenticated();
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }
    return context as OrganizationRequestContext;
  }

  requireWorkspace(): WorkspaceRequestContext {
    const context = this.requireOrganization();
    if (!context.workspaceId) {
      throw new ForbiddenException('Workspace context is required.');
    }
    return context as WorkspaceRequestContext;
  }

  private requireStore(): MutableRequestContext {
    const context = this.storage.getStore();
    if (!context) {
      throw new InternalServerErrorException(
        'Request context was not initialized.',
      );
    }
    return context;
  }
}
