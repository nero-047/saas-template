import { createDatabase } from './client.js';
import { seedRbac } from './rbac/seed.js';

const connection = createDatabase();

try {
  const result = await seedRbac(connection.db);
  process.stdout.write(
    `Seeded ${result.permissionCount} permissions across ${result.organizations.length} organizations.\n`,
  );
} finally {
  await connection.close();
}
