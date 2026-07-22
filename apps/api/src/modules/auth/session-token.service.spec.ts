import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { SessionTokenService } from './session-token.service';

describe('SessionTokenService', () => {
  const config = {
    session: { ttlSeconds: 3600 },
  } as AuthRuntimeConfigService;
  const tokens = new SessionTokenService(config);

  it('creates random opaque credentials and separate storage hashes', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const first = tokens.create(now);
    const second = tokens.create(now);

    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.tokenHash).not.toBe(first.token);
    expect(first.tokenHash).toBe(tokens.hash(first.token));
    expect(first.token).not.toBe(second.token);
    expect(first.expiresAt.toISOString()).toBe('2026-01-01T01:00:00.000Z');
  });
});
