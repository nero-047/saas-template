import { sql } from 'drizzle-orm';
import {
  foreignKey,
  index,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organizations } from './organizations.js';
import { users } from './users.js';
import { workspaces } from './workspaces.js';

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workspaceId, table.organizationId],
      foreignColumns: [workspaces.id, workspaces.organizationId],
      name: 'memberships_workspace_organization_fk',
    }).onDelete('cascade'),
    index('memberships_user_id_idx').on(table.userId),
    index('memberships_organization_id_idx').on(table.organizationId),
    index('memberships_workspace_id_idx').on(table.workspaceId),
    unique('memberships_id_organization_id_unique').on(
      table.id,
      table.organizationId,
    ),
    uniqueIndex('memberships_organization_user_unique')
      .on(table.organizationId, table.userId)
      .where(sql`${table.workspaceId} is null`),
    uniqueIndex('memberships_workspace_user_unique')
      .on(table.workspaceId, table.userId)
      .where(sql`${table.workspaceId} is not null`),
  ],
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
