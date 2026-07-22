import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createDatabase } from '@saas-template/db';

type DatabaseConnection = ReturnType<typeof createDatabase>;

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private connection?: DatabaseConnection;

  get db(): DatabaseConnection['db'] {
    return this.getConnection().db;
  }

  get client(): DatabaseConnection['client'] {
    return this.getConnection().client;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }

  private getConnection(): DatabaseConnection {
    this.connection ??= createDatabase();
    return this.connection;
  }
}
