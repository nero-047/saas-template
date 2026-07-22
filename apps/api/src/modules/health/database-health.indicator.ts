import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(private readonly database: DatabaseService) {}

  async check(): Promise<boolean> {
    try {
      await this.database.client`select 1`;
      return true;
    } catch {
      return false;
    }
  }
}
