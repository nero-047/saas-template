import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SessionsRepository } from './sessions.repository';

describe('AuthService foundation', () => {
  const sessions = {
    findActiveByTokenHash: jest.fn(),
    revoke: jest.fn(),
  };
  const service = new AuthService(sessions as unknown as SessionsRepository);

  beforeEach(() => {
    sessions.findActiveByTokenHash.mockReset();
    sessions.revoke.mockReset();
  });

  it('uses the shared login request schema', () => {
    expect(
      service.parseLoginRequest({
        email: '  USER@EXAMPLE.COM ',
        password: 'not-verified-here',
      }),
    ).toEqual({
      email: 'user@example.com',
      password: 'not-verified-here',
    });
  });

  it('resolves only an active repository session', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    sessions.findActiveByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
    });

    await expect(
      service.resolveCurrentUserByTokenHash('hashed-token', now),
    ).resolves.toEqual({ id: 'user-id', sessionId: 'session-id' });
    expect(sessions.findActiveByTokenHash).toHaveBeenCalledWith(
      'hashed-token',
      now,
    );

    sessions.findActiveByTokenHash.mockResolvedValue(undefined);
    await expect(
      service.resolveCurrentUserByTokenHash('missing-token', now),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
