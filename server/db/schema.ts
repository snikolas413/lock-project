import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Initial foundation only. Product entities will be added with reviewed migrations.
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
