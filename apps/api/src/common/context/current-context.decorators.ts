import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import type { CurrentUser as AuthenticatedUser } from '../../modules/auth/current-user';
import type { ContextRequest } from './context-request';
import type { MutableRequestContext } from './request-context';

function contextFrom(
  executionContext: ExecutionContext,
): MutableRequestContext {
  const request = executionContext.switchToHttp().getRequest<ContextRequest>();
  if (!request.requestContext) {
    throw new InternalServerErrorException(
      'Request context middleware did not initialize the request.',
    );
  }
  return request.requestContext;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): AuthenticatedUser => {
    const context = contextFrom(executionContext);
    if (!context.userId || !context.sessionId) {
      throw new UnauthorizedException('Authentication is required.');
    }
    return { id: context.userId, sessionId: context.sessionId };
  },
);

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): string => {
    const organizationId = contextFrom(executionContext).organizationId;
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }
    return organizationId;
  },
);

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): string => {
    const workspaceId = contextFrom(executionContext).workspaceId;
    if (!workspaceId) {
      throw new ForbiddenException('Workspace context is required.');
    }
    return workspaceId;
  },
);

export const Permissions = createParamDecorator(
  (_data: unknown, executionContext: ExecutionContext): readonly string[] => [
    ...contextFrom(executionContext).permissions,
  ],
);
