import type { CurrentUser } from './current-user';
import type { CookieRequest } from './session-cookie.service';

export interface AuthenticatedRequest extends CookieRequest {
  currentUser?: CurrentUser;
}
