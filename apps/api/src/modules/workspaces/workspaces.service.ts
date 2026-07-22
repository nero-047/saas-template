import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MembershipsRepository } from '../organizations/memberships.repository';
import type { OrganizationContext } from '../organizations/organization-context';
import type { WorkspaceContext } from './workspace-context';
import { WorkspacesRepository } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: MembershipsRepository,
  ) {}

  async resolveContext(
    organizationContext: OrganizationContext,
    workspaceId: string,
  ): Promise<WorkspaceContext> {
    const organizationId = organizationContext.organization.id;
    const membership = await this.memberships.findWorkspaceMembership(
      organizationContext.currentUser.id,
      organizationId,
      workspaceId,
    );

    if (!membership) {
      throw new ForbiddenException('Workspace access is not permitted.');
    }

    const workspace = await this.workspaces.findById(
      organizationId,
      workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace was not found.');
    }

    return { organizationContext, workspace, membership };
  }
}
