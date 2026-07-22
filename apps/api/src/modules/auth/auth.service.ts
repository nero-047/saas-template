import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  loginRequestSchema,
  type LoginRequest,
} from '@saas-template/validation';

import type { CurrentUser } from './current-user';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class AuthService {
  constructor(private readonly sessions: SessionsRepository) {}

  parseLoginRequest(input: unknown): LoginRequest {
    return loginRequestSchema.parse(input);
  }

  async resolveCurrentUserByTokenHash(
    tokenHash: string,
    now: Date = new Date(),
  ): Promise<CurrentUser> {
    const session = await this.sessions.findActiveByTokenHash(tokenHash, now);

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
