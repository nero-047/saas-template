import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, sessions } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class SessionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findActiveByTokenHash(tokenHash: string, now: Date) {
    const [session] = await this.database.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, now),
          isNull(sessions.revokedAt),
        ),
      )
      .limit(1);

    return session;
  }

  async revoke(sessionId: string, revokedAt: Date): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt, updatedAt: revokedAt })
      .where(eq(sessions.id, sessionId));
  }
}
