import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  organizationContextSchema,
  workspaceContextSchema,
} from '@saas-template/validation';

import type { CurrentUser as AuthenticatedUser } from '../../modules/auth/current-user';
import type { ContextRequest } from './context-request';
import { RequestContextService } from './request-context.service';
import { TenantContextService } from './tenant-context.service';

function singleHeader(
  request: ContextRequest,
  name: string,
): string | undefined {
  const value = request.headers[name];
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly tenants: TenantContextService,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<ContextRequest>();
    const authenticated = this.requestContext.requireAuthenticated();
    const parsed = organizationContextSchema.safeParse({
      organizationId: singleHeader(request, 'x-organization-id'),
    });
    if (!parsed.success) {
      throw new BadRequestException(
        'A valid X-Organization-Id header is required.',
      );
    }

    const resolved = await this.tenants.resolveOrganization(
      {
        id: authenticated.userId,
        sessionId: authenticated.sessionId,
      } satisfies AuthenticatedUser,
      parsed.data.organizationId,
    );
    request.organizationContext = resolved.context;
    this.requestContext.setOrganization(
      resolved.context.organization.id,
      resolved.permissions,
    );
    return true;
  }
}

@Injectable()
export class WorkspaceContextGuard implements CanActivate {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly tenants: TenantContextService,
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<ContextRequest>();
    const organization = this.requestContext.requireOrganization();
    if (!request.organizationContext) {
      throw new ForbiddenException('Organization context is required.');
    }

    const parsed = workspaceContextSchema.safeParse({
      organizationId: organization.organizationId,
      workspaceId: singleHeader(request, 'x-workspace-id'),
    });
    if (!parsed.success) {
      throw new BadRequestException(
        'A valid X-Workspace-Id header is required.',
      );
    }

    const resolved = await this.tenants.resolveWorkspace(
      request.organizationContext,
      parsed.data.workspaceId,
    );
    request.workspaceContext = resolved.context;
    this.requestContext.setWorkspace(
      resolved.context.workspace.id,
      resolved.permissions,
    );
    return true;
  }
}
