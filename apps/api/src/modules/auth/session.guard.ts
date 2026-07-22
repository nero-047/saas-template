import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { ContextRequest } from '../../common/context/context-request';
import { RequestContextService } from '../../common/context/request-context.service';
import { AuthService } from './auth.service';
import { SessionCookieService } from './session-cookie.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: SessionCookieService,
    private readonly requestContext: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ContextRequest>();
    const token = this.cookies.read(request);

    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.currentUser = await this.auth.authenticate(token);
    this.requestContext.setAuthenticatedUser(request.currentUser);
    return true;
  }
}
