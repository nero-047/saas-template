import type { Membership, Workspace } from '@saas-template/db';

import type { OrganizationContext } from '../organizations/organization-context';

export interface WorkspaceContext {
  readonly organizationContext: OrganizationContext;
  readonly workspace: Workspace;
  readonly membership: Membership;
}
