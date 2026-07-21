import { defineConfig } from 'drizzle-kit';

const migrationOutput = process.env.DRIZZLE_OUT?.trim() || './drizzle';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: migrationOutput,
  strict: true,
  verbose: true,
});
