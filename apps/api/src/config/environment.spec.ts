import { loadApiEnvironment } from './environment';

describe('loadApiEnvironment', () => {
  it('uses the default port when PORT is absent', () => {
    expect(loadApiEnvironment({})).toEqual({
      port: 3000,
      session: {
        cookieName: 'session',
        cookieSecure: false,
        cookieSameSite: 'lax',
        ttlSeconds: 2_592_000,
      },
    });
  });

  it('parses a valid runtime port', () => {
    expect(loadApiEnvironment({ PORT: '4100' }).port).toBe(4100);
  });

  it.each(['not-a-port', '0', '65536'])('rejects invalid PORT=%s', (port) => {
    expect(() => loadApiEnvironment({ PORT: port })).toThrow(
      'PORT must be an integer between 1 and 65535.',
    );
  });

  it('defaults secure cookies on in production', () => {
    expect(loadApiEnvironment({ NODE_ENV: 'production' }).session).toEqual({
      cookieName: 'session',
      cookieSecure: true,
      cookieSameSite: 'lax',
      ttlSeconds: 2_592_000,
    });
  });

  it('accepts explicit session cookie settings', () => {
    expect(
      loadApiEnvironment({
        SESSION_COOKIE_NAME: '__Host-saas_session',
        SESSION_COOKIE_SECURE: 'true',
        SESSION_COOKIE_SAME_SITE: 'strict',
        SESSION_TTL_SECONDS: '3600',
      }).session,
    ).toEqual({
      cookieName: '__Host-saas_session',
      cookieSecure: true,
      cookieSameSite: 'strict',
      ttlSeconds: 3600,
    });
  });

  it('requires Secure cookies for SameSite=None', () => {
    expect(() =>
      loadApiEnvironment({
        SESSION_COOKIE_SECURE: 'false',
        SESSION_COOKIE_SAME_SITE: 'none',
      }),
    ).toThrow(
      'SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE is none.',
    );
  });

  it('requires Secure cookies for reserved secure cookie prefixes', () => {
    expect(() =>
      loadApiEnvironment({
        SESSION_COOKIE_NAME: '__Host-session',
        SESSION_COOKIE_SECURE: 'false',
      }),
    ).toThrow(
      'SESSION_COOKIE_SECURE must be true for __Host- and __Secure- cookie names.',
    );
  });
});
