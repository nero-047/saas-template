import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { schema } from './schema.js';

export interface CreateDatabaseOptions {
  readonly connectionString?: string;
  readonly maxConnections?: number;
}

function requireConnectionString(connectionString?: string): string {
  const value = connectionString ?? process.env.DATABASE_URL;

  if (!value?.trim()) {
    throw new Error(
      'DATABASE_URL is required to create a PostgreSQL database client.',
    );
  }

  return value;
}

export function createDatabase(options: CreateDatabaseOptions = {}) {
  const client = postgres(requireConnectionString(options.connectionString), {
    max: options.maxConnections ?? 10,
  });
  const db = drizzle(client, { schema });

  return {
    client,
    db,
    close: () => client.end(),
  };
}

export type Database = ReturnType<typeof createDatabase>['db'];
