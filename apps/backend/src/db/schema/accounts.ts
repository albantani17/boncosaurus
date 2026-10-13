import { boolean, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { currencyCode, money, timestamps, uuidV7Pk } from './columns';
import { accountType } from './enums';
import { workspaces } from './workspaces';

export const accounts = pgTable(
  'accounts',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: accountType('type').notNull(),
    currency: currencyCode('currency').notNull(),
    initialBalance: money('initial_balance').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps()
  },
  (table) => [
    unique('accounts_workspace_name_unique').on(table.workspaceId, table.name),
    unique('accounts_workspace_id_unique').on(table.workspaceId, table.id)
  ]
);
