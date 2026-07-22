import { Injectable } from '@nestjs/common';
import { parse, serialize } from 'cookie';

import { AuthRuntimeConfigService } from './auth-runtime-config.service';

export interface CookieRequest {
  readonly headers: {
    readonly cookie?: string;
  };
}

export interface CookieResponse {
  appendHeader(name: string, value: string): unknown;
}

@Injectable()
export class SessionCookieService {
  constructor(private readonly config: AuthRuntimeConfigService) {}

  read(request: CookieRequest): string | undefined {
    const header = request.headers.cookie;
    if (!header) {
      return undefined;
    }

    return parse(header)[this.config.session.cookieName];
  }

  set(response: CookieResponse, token: string, expiresAt: Date): void {
    response.appendHeader(
      'Set-Cookie',
      serialize(this.config.session.cookieName, token, {
        httpOnly: true,
        secure: this.config.session.cookieSecure,
        sameSite: this.config.session.cookieSameSite,
        expires: expiresAt,
        maxAge: this.config.session.ttlSeconds,
        path: '/',
      }),
    );
  }

  clear(response: CookieResponse): void {
    response.appendHeader(
      'Set-Cookie',
      serialize(this.config.session.cookieName, '', {
        httpOnly: true,
        secure: this.config.session.cookieSecure,
        sameSite: this.config.session.cookieSameSite,
        expires: new Date(0),
        maxAge: 0,
        path: '/',
      }),
    );
  }
}
