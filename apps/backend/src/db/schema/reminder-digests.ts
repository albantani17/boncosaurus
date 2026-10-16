import { date, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { createdAt, uuidV7Pk } from './columns';
import { users } from './users';
import { workspaces } from './workspaces';

/** One row per user, workspace and day a reminder push went out; the unique key stops repeats. */
export const reminderDigests = pgTable(
  'reminder_digests',
  {
    id: uuidV7Pk(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    sentOn: date('sent_on', { mode: 'string' }).notNull(),
    createdAt: createdAt()
  },
  (table) => [unique('reminder_digests_user_workspace_day_unique').on(table.userId, table.workspaceId, table.sentOn)]
);
