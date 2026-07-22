import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { MembershipsRepository } from './memberships.repository';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const organizations = { findById: jest.fn() };
  const memberships = { findOrganizationAccessMembership: jest.fn() };
  const service = new OrganizationsService(
    organizations as unknown as OrganizationsRepository,
    memberships as unknown as MembershipsRepository,
  );
  const currentUser = { id: 'user-id', sessionId: 'session-id' };

  beforeEach(() => {
    organizations.findById.mockReset();
    memberships.findOrganizationAccessMembership.mockReset();
  });

  it('resolves an organization through an allowed membership', async () => {
    const membership = {
      id: 'membership-id',
      organizationId: 'organization-id',
      workspaceId: 'workspace-id',
    };
    const organization = { id: 'organization-id', name: 'Example' };
    memberships.findOrganizationAccessMembership.mockResolvedValue(membership);
    organizations.findById.mockResolvedValue(organization);

    await expect(
      service.resolveContext(currentUser, 'organization-id'),
    ).resolves.toEqual({ currentUser, organization, membership });
  });

  it('denies access without a membership before loading tenant data', async () => {
    memberships.findOrganizationAccessMembership.mockResolvedValue(undefined);

    await expect(
      service.resolveContext(currentUser, 'organization-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(organizations.findById).not.toHaveBeenCalled();
  });

  it('does not leak a missing organization as authorization success', async () => {
    memberships.findOrganizationAccessMembership.mockResolvedValue({
      id: 'membership-id',
    });
    organizations.findById.mockResolvedValue(undefined);

    await expect(
      service.resolveContext(currentUser, 'organization-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
