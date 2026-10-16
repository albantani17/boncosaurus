import { sql } from 'drizzle-orm';
import { boolean, pgTable, text, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps, uuidV7Pk } from './columns';
import { counterpartyKind } from './enums';
import { workspaces } from './workspaces';

export const counterparties = pgTable(
  'counterparties',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: counterpartyKind('kind').notNull(),
    note: text('note'),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps()
  },
  (table) => [
    uniqueIndex('counterparties_workspace_name_unique').on(table.workspaceId, sql`lower(${table.name})`),
    unique('counterparties_workspace_id_unique').on(table.workspaceId, table.id)
  ]
);
