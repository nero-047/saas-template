import type { Membership, Organization } from '@saas-template/db';

import type { CurrentUser } from '../auth/current-user';

export interface OrganizationContext {
  readonly currentUser: CurrentUser;
  readonly organization: Organization;
  readonly membership: Membership;
}
