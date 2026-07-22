import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  API_ERROR_CODES,
  apiErrorResponseSchema,
  requestIdSchema,
} from '@saas-template/validation';
import request from 'supertest';

import { RequestContextMiddleware } from '../context/request-context.middleware';
import { RequestContextService } from '../context/request-context.service';
import { ApiExceptionFilter } from './api-exception.filter';
import { InvalidCredentialsException } from './api-http.exceptions';

@Controller('test-errors')
class TestErrorController {
  @Get('ok')
  ok() {
    return { status: 'ok' };
  }

  @Get('validation')
  validation(): never {
    throw new BadRequestException({ message: ['email must be valid'] });
  }

  @Get('auth-required')
  authRequired(): never {
    throw new UnauthorizedException('Internal authentication detail.');
  }

  @Get('invalid-credentials')
  invalidCredentials(): never {
    throw new InvalidCredentialsException();
  }

  @Get('unexpected')
  unexpected(): never {
    throw new Error(
      'SELECT password_hash FROM users; database.internal; secret=value',
    );
  }
}

describe('API request identity and error handling', () => {
  let app: INestApplication;
  let loggerError: jest.SpyInstance;
  const incomingRequestId = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestErrorController],
      providers: [
        RequestContextMiddleware,
        RequestContextService,
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    }).compile();

    app = module.createNestApplication();
    const middleware = module.get(RequestContextMiddleware);
    app.use(middleware.use.bind(middleware));
    await app.init();
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterAll(async () => {
    loggerError.mockRestore();
    await app.close();
  });

  it('generates a request ID and returns it in the response header', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/ok')
      .set('X-Request-ID', 'invalid request id')
      .expect(200);

    expect(
      requestIdSchema.safeParse(response.headers['x-request-id']).success,
    ).toBe(true);
    expect(response.headers['x-request-id']).not.toBe('invalid request id');
  });

  it('accepts a valid incoming request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/ok')
      .set('X-Request-ID', incomingRequestId)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(incomingRequestId);
  });

  it('formats validation errors without exposing raw validator messages', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/validation')
      .set('X-Request-ID', incomingRequestId)
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Request validation failed.',
      },
      requestId: incomingRequestId,
    });
    expect(apiErrorResponseSchema.safeParse(response.body).success).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('email must be valid');
  });

  it('formats missing authentication without exposing exception details', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/auth-required')
      .set('X-Request-ID', incomingRequestId)
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: API_ERROR_CODES.AUTH_REQUIRED,
        message: 'Authentication is required.',
      },
      requestId: incomingRequestId,
    });
    expect(JSON.stringify(response.body)).not.toContain(
      'Internal authentication detail',
    );
  });

  it('distinguishes invalid credentials from a missing session', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/invalid-credentials')
      .set('X-Request-ID', incomingRequestId)
      .expect(401);

    expect(response.body.error.code).toBe(API_ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('sanitizes unexpected errors and retains the request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-errors/unexpected')
      .set('X-Request-ID', incomingRequestId)
      .expect(500);

    expect(response.headers['x-request-id']).toBe(incomingRequestId);
    expect(response.body).toEqual({
      error: {
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred.',
      },
      requestId: incomingRequestId,
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /SELECT|password_hash|database\.internal|secret=value/,
    );
  });
});
