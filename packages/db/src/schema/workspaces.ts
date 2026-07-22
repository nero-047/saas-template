import {
  index,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { organizations } from './organizations.js';

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('workspaces_organization_id_idx').on(table.organizationId),
    uniqueIndex('workspaces_organization_slug_unique').on(
      table.organizationId,
      table.slug,
    ),
    unique('workspaces_id_organization_id_unique').on(
      table.id,
      table.organizationId,
    ),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
