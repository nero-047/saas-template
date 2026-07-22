import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { SessionCookieService } from './session-cookie.service';

describe('SessionCookieService', () => {
  const config = {
    session: {
      cookieName: '__Host-session',
      cookieSecure: true,
      cookieSameSite: 'lax',
      ttlSeconds: 3600,
    },
  } as AuthRuntimeConfigService;
  const cookies = new SessionCookieService(config);

  it('sets an HttpOnly host-only secure session cookie', () => {
    const response = { appendHeader: jest.fn() };

    cookies.set(response, 'opaque-token', new Date('2026-01-01T01:00:00.000Z'));

    expect(response.appendHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringMatching(
        /^__Host-session=opaque-token; Max-Age=3600; Path=\/; Expires=.*; HttpOnly; Secure; SameSite=Lax$/,
      ),
    );
  });

  it('expires the same cookie on logout', () => {
    const response = { appendHeader: jest.fn() };

    cookies.clear(response);

    expect(response.appendHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringMatching(
        /^__Host-session=; Max-Age=0; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax$/,
      ),
    );
  });
});
