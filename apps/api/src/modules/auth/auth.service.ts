import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from '@saas-template/validation';

import type { CurrentUser } from './current-user';
import { DuplicateEmailError, IdentityRepository } from './identity.repository';
import { PasswordService } from './password.service';
import { SessionTokenService } from './session-token.service';
import { SessionsRepository } from './sessions.repository';

export interface EstablishedAuthentication {
  readonly response: AuthResponse;
  readonly token: string;
  readonly expiresAt: Date;
}

interface RequestSchema<T> {
  safeParse(
    input: unknown,
  ): { readonly success: true; readonly data: T } | { readonly success: false };
}

function parseRequest<T>(schema: RequestSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException('The authentication request is invalid.');
  }
  return result.data;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase();
}

function displayNameFromEmail(email: string): string {
  return (email.slice(0, email.indexOf('@')) || 'Owner').slice(0, 180);
}

function toAuthResponse(
  user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string;
    readonly emailVerifiedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  },
  expiresAt: Date,
): AuthResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    session: { expiresAt: expiresAt.toISOString() },
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly identities: IdentityRepository,
    private readonly sessions: SessionsRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: SessionTokenService,
  ) {}

  async register(input: unknown): Promise<EstablishedAuthentication> {
    const request = parseRequest<RegisterRequest>(registerRequestSchema, input);
    const normalizedEmail = normalizeEmail(request.email);
    if (await this.identities.findByNormalizedEmail(normalizedEmail)) {
      throw new ConflictException('The email is already registered.');
    }

    const now = new Date();
    const passwordHash = await this.passwords.hash(request.password);
    const credential = this.tokens.create(now);
    const displayName = displayNameFromEmail(request.email);

    try {
      const result = await this.identities.register({
        email: request.email,
        normalizedEmail,
        displayName,
        passwordHash,
        organizationName: `${displayName}'s Organization`,
        organizationSlug: `org-${randomUUID()}`,
        tokenHash: credential.tokenHash,
        expiresAt: credential.expiresAt,
        now,
      });

      return {
        response: toAuthResponse(result.user, result.session.expiresAt),
        token: credential.token,
        expiresAt: result.session.expiresAt,
      };
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException('The email is already registered.');
      }
      throw error;
    }
  }

  async login(input: unknown): Promise<EstablishedAuthentication> {
    const request = parseRequest<LoginRequest>(loginRequestSchema, input);
    const user = await this.identities.findByNormalizedEmail(
      normalizeEmail(request.email),
    );
    const passwordMatches = await this.passwords.matches(
      request.password,
      user?.passwordHash,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Email or password is invalid.');
    }

    const now = new Date();
    const credential = this.tokens.create(now);
    const session = await this.sessions.create({
      userId: user.id,
      tokenHash: credential.tokenHash,
      expiresAt: credential.expiresAt,
      now,
    });

    return {
      response: toAuthResponse(user, session.expiresAt),
      token: credential.token,
      expiresAt: session.expiresAt,
    };
  }

  async authenticate(
    token: string,
    now: Date = new Date(),
  ): Promise<CurrentUser> {
    const session = await this.sessions.findActiveAndTouch(
      this.tokens.hash(token),
      now,
    );
    if (!session) {
      throw new UnauthorizedException('Authentication is required.');
    }
    return { id: session.userId, sessionId: session.id };
  }

  async logout(
    currentUser: CurrentUser,
    now: Date = new Date(),
  ): Promise<void> {
    await this.sessions.revoke(currentUser.sessionId, now);
  }
}
