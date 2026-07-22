import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, sessions } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

export interface CreateSessionRecord {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly now: Date;
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(input: CreateSessionRecord) {
    const [session] = await this.database.db
      .insert(sessions)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        lastUsedAt: input.now,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .returning();
    if (!session) {
      throw new Error('Session insertion did not return a row.');
    }
    return session;
  }

  async findActiveAndTouch(tokenHash: string, now: Date) {
    const [session] = await this.database.db
      .update(sessions)
      .set({ lastUsedAt: now, updatedAt: now })
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, now),
          isNull(sessions.revokedAt),
        ),
      )
      .returning();
    return session;
  }

  async revoke(sessionId: string, revokedAt: Date): Promise<void> {
    await this.database.db
      .update(sessions)
      .set({ revokedAt, updatedAt: revokedAt })
      .where(eq(sessions.id, sessionId));
  }
}
