import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createDatabase } from '@saas-template/db';

type DatabaseConnection = ReturnType<typeof createDatabase>;

@Injectable()
export class DatabaseHealthIndicator implements OnApplicationShutdown {
  private connection?: DatabaseConnection;

  async check(): Promise<boolean> {
    try {
      this.connection ??= createDatabase({ maxConnections: 1 });
      await this.connection.client`select 1`;
      return true;
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }
}
