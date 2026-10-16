import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps, uuidV7Pk } from './columns';
import { users } from './users';
import { workspaces } from './workspaces';

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuidV7Pk(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  ...timestamps()
});
