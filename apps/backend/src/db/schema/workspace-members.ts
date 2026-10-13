import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { createdAt } from './columns';
import { workspaceRole } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRole('role').notNull().default('member'),
    createdAt: createdAt()
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })]
);
