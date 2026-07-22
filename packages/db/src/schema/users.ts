import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 320 }).notNull(),
    normalizedEmail: varchar('normalized_email', { length: 320 }).notNull(),
    displayName: varchar('display_name', { length: 200 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    passwordUpdatedAt: timestamp('password_updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('users_normalized_email_unique').on(table.normalizedEmail),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
