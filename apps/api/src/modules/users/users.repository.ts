import { Injectable } from '@nestjs/common';
import { eq, users } from '@saas-template/db';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(userId: string) {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user;
  }
}
