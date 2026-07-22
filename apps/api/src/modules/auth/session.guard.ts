import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './authenticated-request';
import { AuthService } from './auth.service';
import { SessionCookieService } from './session-cookie.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: SessionCookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.cookies.read(request);

    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new UnauthorizedException('Authentication is required.');
    }

    request.currentUser = await this.auth.authenticate(token);
    return true;
  }
}
