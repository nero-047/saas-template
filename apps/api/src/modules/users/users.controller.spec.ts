import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AuthRuntimeConfigService } from '../auth/auth-runtime-config.service';
import { AuthService } from '../auth/auth.service';
import { SessionCookieService } from '../auth/session-cookie.service';
import { SessionGuard } from '../auth/session.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('authenticated current-user request', () => {
  let app: INestApplication;
  const auth = { authenticate: jest.fn() };
  const users = { getCurrent: jest.fn() };
  const token = 'a'.repeat(43);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        SessionCookieService,
        SessionGuard,
        {
          provide: AuthRuntimeConfigService,
          useValue: {
            session: {
              cookieName: 'session',
              cookieSecure: false,
              cookieSameSite: 'lax',
              ttlSeconds: 3600,
            },
          },
        },
        { provide: AuthService, useValue: auth },
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the current user established by the session guard', async () => {
    const currentUser = { id: 'user-id', sessionId: 'session-id' };
    const responseBody = {
      id: 'user-id',
      email: 'owner@example.com',
      displayName: 'Owner',
      emailVerifiedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    auth.authenticate.mockResolvedValue(currentUser);
    users.getCurrent.mockResolvedValue(responseBody);

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', `session=${token}`)
      .expect(200)
      .expect(responseBody);

    expect(auth.authenticate).toHaveBeenCalledWith(token);
    expect(users.getCurrent).toHaveBeenCalledWith(currentUser);
  });

  it('rejects a request without a session cookie', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    expect(users.getCurrent).not.toHaveBeenCalled();
  });
});
