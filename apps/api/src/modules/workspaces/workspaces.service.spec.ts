import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { MembershipsRepository } from '../organizations/memberships.repository';
import type { OrganizationContext } from '../organizations/organization-context';
import { WorkspacesRepository } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const workspaces = { findById: jest.fn() };
  const memberships = { findWorkspaceMembership: jest.fn() };
  const service = new WorkspacesService(
    workspaces as unknown as WorkspacesRepository,
    memberships as unknown as MembershipsRepository,
  );
  const organizationContext = {
    currentUser: { id: 'user-id', sessionId: 'session-id' },
    organization: { id: 'organization-id' },
    membership: { id: 'organization-membership-id' },
  } as OrganizationContext;

  beforeEach(() => {
    workspaces.findById.mockReset();
    memberships.findWorkspaceMembership.mockReset();
  });

  it('resolves an authorized workspace in the selected organization', async () => {
    const membership = { id: 'workspace-membership-id' };
    const workspace = {
      id: 'workspace-id',
      organizationId: 'organization-id',
    };
    memberships.findWorkspaceMembership.mockResolvedValue(membership);
    workspaces.findById.mockResolvedValue(workspace);

    await expect(
      service.resolveContext(organizationContext, 'workspace-id'),
    ).resolves.toEqual({ organizationContext, workspace, membership });
    expect(workspaces.findById).toHaveBeenCalledWith(
      'organization-id',
      'workspace-id',
    );
  });

  it('denies access before loading unauthorized workspace data', async () => {
    memberships.findWorkspaceMembership.mockResolvedValue(undefined);

    await expect(
      service.resolveContext(organizationContext, 'workspace-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(workspaces.findById).not.toHaveBeenCalled();
  });

  it('reports a missing workspace after access is established', async () => {
    memberships.findWorkspaceMembership.mockResolvedValue({
      id: 'organization-membership-id',
    });
    workspaces.findById.mockResolvedValue(undefined);

    await expect(
      service.resolveContext(organizationContext, 'workspace-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
