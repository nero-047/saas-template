import type { CurrentUser as AuthenticatedUser } from '../../modules/auth/current-user';
import type { OrganizationContext } from '../../modules/organizations/organization-context';
import type { WorkspaceContext } from '../../modules/workspaces/workspace-context';
import type { CookieRequest } from '../../modules/auth/session-cookie.service';
import type { ContextCarrierRequest } from './request-context';

export interface ContextRequest extends CookieRequest, ContextCarrierRequest {
  currentUser?: AuthenticatedUser;
  organizationContext?: OrganizationContext;
  workspaceContext?: WorkspaceContext;
  readonly headers: CookieRequest['headers'] &
    Readonly<Record<string, string | string[] | undefined>>;
}
