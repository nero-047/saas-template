import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'drizzle-kit';

const workspaceEnvFile = fileURLToPath(new URL('../../.env', import.meta.url));

if (existsSync(workspaceEnvFile)) {
  loadEnvFile(workspaceEnvFile);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.trim()) {
  throw new Error(
    'DATABASE_URL is required for this Drizzle database command.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
