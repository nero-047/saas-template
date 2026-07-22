import { Injectable } from '@nestjs/common';

import type { CurrentUser as AuthenticatedUser } from '../../modules/auth/current-user';
import type { OrganizationContext } from '../../modules/organizations/organization-context';
import { OrganizationsService } from '../../modules/organizations/organizations.service';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import type { WorkspaceContext } from '../../modules/workspaces/workspace-context';
import { WorkspacesService } from '../../modules/workspaces/workspaces.service';

@Injectable()
export class TenantContextService {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly workspaces: WorkspacesService,
    private readonly permissions: PermissionsService,
  ) {}

  async resolveOrganization(
    user: AuthenticatedUser,
    organizationId: string,
  ): Promise<{
    readonly context: OrganizationContext;
    readonly permissions: readonly string[];
  }> {
    const context = await this.organizations.resolveContext(
      user,
      organizationId,
    );
    const permissions =
      context.membership.workspaceId === null
        ? await this.permissions.forMembership(context.membership.id)
        : [];
    return { context, permissions };
  }

  async resolveWorkspace(
    organizationContext: OrganizationContext,
    workspaceId: string,
  ): Promise<{
    readonly context: WorkspaceContext;
    readonly permissions: readonly string[];
  }> {
    const context = await this.workspaces.resolveContext(
      organizationContext,
      workspaceId,
    );
    const permissions = await this.permissions.forMembership(
      context.membership.id,
    );
    return { context, permissions };
  }
}
