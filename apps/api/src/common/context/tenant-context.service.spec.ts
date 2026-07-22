import { OrganizationsService } from '../../modules/organizations/organizations.service';
import type { OrganizationContext } from '../../modules/organizations/organization-context';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { WorkspacesService } from '../../modules/workspaces/workspaces.service';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  const organizations = { resolveContext: jest.fn() };
  const workspaces = { resolveContext: jest.fn() };
  const permissions = { forMembership: jest.fn() };
  const service = new TenantContextService(
    organizations as unknown as OrganizationsService,
    workspaces as unknown as WorkspacesService,
    permissions as unknown as PermissionsService,
  );
  const user = { id: 'user-id', sessionId: 'session-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads organization permissions only from an organization membership', async () => {
    const context = {
      currentUser: user,
      organization: { id: 'organization-id' },
      membership: { id: 'organization-membership-id', workspaceId: null },
    };
    organizations.resolveContext.mockResolvedValue(context);
    permissions.forMembership.mockResolvedValue(['organization.update']);

    await expect(
      service.resolveOrganization(user, 'organization-id'),
    ).resolves.toEqual({
      context,
      permissions: ['organization.update'],
    });
    expect(permissions.forMembership).toHaveBeenCalledWith(
      'organization-membership-id',
    );
  });

  it('does not promote workspace-only grants to organization scope', async () => {
    const context = {
      currentUser: user,
      organization: { id: 'organization-id' },
      membership: {
        id: 'workspace-membership-id',
        workspaceId: 'workspace-id',
      },
    };
    organizations.resolveContext.mockResolvedValue(context);

    await expect(
      service.resolveOrganization(user, 'organization-id'),
    ).resolves.toEqual({ context, permissions: [] });
    expect(permissions.forMembership).not.toHaveBeenCalled();
  });

  it('loads permissions from the membership resolved for one workspace', async () => {
    const organizationContext = {
      currentUser: user,
      organization: { id: 'organization-id' },
      membership: { id: 'organization-membership-id', workspaceId: null },
    };
    const context = {
      organizationContext,
      workspace: { id: 'workspace-id', organizationId: 'organization-id' },
      membership: {
        id: 'workspace-membership-id',
        workspaceId: 'workspace-id',
      },
    };
    workspaces.resolveContext.mockResolvedValue(context);
    permissions.forMembership.mockResolvedValue(['workspace.update']);

    await expect(
      service.resolveWorkspace(
        organizationContext as unknown as OrganizationContext,
        'workspace-id',
      ),
    ).resolves.toEqual({ context, permissions: ['workspace.update'] });
    expect(permissions.forMembership).toHaveBeenCalledWith(
      'workspace-membership-id',
    );
  });
});
