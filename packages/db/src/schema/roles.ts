import {
  boolean,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { memberships } from './memberships.js';
import { organizations } from './organizations.js';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('roles_organization_id_idx').on(table.organizationId),
    uniqueIndex('roles_organization_key_unique').on(
      table.organizationId,
      table.key,
    ),
    unique('roles_id_organization_id_unique').on(
      table.id,
      table.organizationId,
    ),
  ],
);

export const membershipRoles = pgTable(
  'membership_roles',
  {
    membershipId: uuid('membership_id').notNull(),
    roleId: uuid('role_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.membershipId, table.roleId] }),
    foreignKey({
      columns: [table.membershipId, table.organizationId],
      foreignColumns: [memberships.id, memberships.organizationId],
      name: 'membership_roles_membership_organization_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.roleId, table.organizationId],
      foreignColumns: [roles.id, roles.organizationId],
      name: 'membership_roles_role_organization_fk',
    }).onDelete('cascade'),
    index('membership_roles_role_id_idx').on(table.roleId),
  ],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
