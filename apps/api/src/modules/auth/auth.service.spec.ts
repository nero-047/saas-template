import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { IdentityRepository } from './identity.repository';
import { PasswordService } from './password.service';
import { SessionTokenService } from './session-token.service';
import { SessionsRepository } from './sessions.repository';

describe('AuthService', () => {
  const identities = {
    findByNormalizedEmail: jest.fn(),
    register: jest.fn(),
  };
  const sessions = {
    create: jest.fn(),
    findActiveAndTouch: jest.fn(),
    revoke: jest.fn(),
  };
  const passwords = { hash: jest.fn(), matches: jest.fn() };
  const tokens = { create: jest.fn(), hash: jest.fn() };
  const service = new AuthService(
    identities as unknown as IdentityRepository,
    sessions as unknown as SessionsRepository,
    passwords as unknown as PasswordService,
    tokens as unknown as SessionTokenService,
  );
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const expiresAt = new Date('2026-02-01T00:00:00.000Z');
  const user = {
    id: 'user-id',
    email: 'Owner@Example.com',
    normalizedEmail: 'owner@example.com',
    displayName: 'Owner',
    passwordHash: 'argon2-password-hash',
    emailVerifiedAt: null,
    passwordUpdatedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  };
  const credential = {
    token: 'raw-session-token',
    tokenHash: 'hashed-session-token',
    expiresAt,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.create.mockReturnValue(credential);
    tokens.hash.mockReturnValue('hashed-session-token');
  });

  it('registers the user and tenant atomically and establishes a session', async () => {
    identities.findByNormalizedEmail.mockResolvedValue(undefined);
    passwords.hash.mockResolvedValue('argon2-password-hash');
    identities.register.mockResolvedValue({
      user,
      session: { expiresAt },
    });

    const result = await service.register({
      email: ' Owner@Example.com ',
      password: 'a-secure-password',
    });

    expect(passwords.hash).toHaveBeenCalledWith('a-secure-password');
    expect(identities.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'Owner@Example.com',
        normalizedEmail: 'owner@example.com',
        passwordHash: 'argon2-password-hash',
        tokenHash: 'hashed-session-token',
      }),
    );
    expect(identities.register).not.toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'raw-session-token' }),
    );
    expect(result).toEqual({
      response: {
        user: {
          id: 'user-id',
          email: 'Owner@Example.com',
          displayName: 'Owner',
          emailVerifiedAt: null,
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
        session: { expiresAt: expiresAt.toISOString() },
      },
      token: 'raw-session-token',
      expiresAt,
    });
  });

  it('rejects a duplicate normalized email', async () => {
    identities.findByNormalizedEmail.mockResolvedValue(user);

    await expect(
      service.register({
        email: 'OWNER@example.com',
        password: 'a-secure-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(passwords.hash).not.toHaveBeenCalled();
  });

  it('logs in with a valid password and creates a new session', async () => {
    identities.findByNormalizedEmail.mockResolvedValue(user);
    passwords.matches.mockResolvedValue(true);
    sessions.create.mockResolvedValue({ expiresAt });

    const result = await service.login({
      email: 'OWNER@example.com',
      password: 'a-secure-password',
    });

    expect(passwords.matches).toHaveBeenCalledWith(
      'a-secure-password',
      'argon2-password-hash',
    );
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        tokenHash: 'hashed-session-token',
        expiresAt,
      }),
    );
    expect(result.token).toBe('raw-session-token');
  });

  it('uses the same invalid-credentials response for a wrong password', async () => {
    identities.findByNormalizedEmail.mockResolvedValue(user);
    passwords.matches.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      constructor: UnauthorizedException,
      message: 'Email or password is invalid.',
    });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('performs dummy password verification for an unknown email', async () => {
    identities.findByNormalizedEmail.mockResolvedValue(undefined);
    passwords.matches.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'a-secure-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwords.matches).toHaveBeenCalledWith(
      'a-secure-password',
      undefined,
    );
  });

  it('hashes the presented token before resolving the session', async () => {
    sessions.findActiveAndTouch.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
    });

    await expect(service.authenticate('raw-session-token')).resolves.toEqual({
      id: 'user-id',
      sessionId: 'session-id',
    });
    expect(sessions.findActiveAndTouch).toHaveBeenCalledWith(
      'hashed-session-token',
      expect.any(Date),
    );
  });

  it('revokes the current session on logout', async () => {
    await service.logout({ id: 'user-id', sessionId: 'session-id' }, createdAt);

    expect(sessions.revoke).toHaveBeenCalledWith('session-id', createdAt);
  });
});
