import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { organizations } from './organizations.js';
import { users } from './users.js';
import { workspaces } from './workspaces.js';

export type AuditMetadata = Readonly<Record<string, unknown>>;

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id'),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 150 }).notNull(),
    resourceType: varchar('resource_type', { length: 150 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }),
    requestId: uuid('request_id'),
    metadata: jsonb('metadata').$type<AuditMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workspaceId, table.organizationId],
      foreignColumns: [workspaces.id, workspaces.organizationId],
      name: 'audit_logs_workspace_organization_fk',
    }),
    index('audit_logs_organization_created_at_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    index('audit_logs_organization_workspace_created_at_idx').on(
      table.organizationId,
      table.workspaceId,
      table.createdAt,
    ),
    index('audit_logs_organization_action_created_at_idx').on(
      table.organizationId,
      table.action,
      table.createdAt,
    ),
    index('audit_logs_organization_resource_idx').on(
      table.organizationId,
      table.resourceType,
      table.resourceId,
    ),
    index('audit_logs_user_created_at_idx').on(table.userId, table.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
