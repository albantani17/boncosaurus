import { boolean, foreignKey, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps, uuidV7Pk } from './columns';
import { categoryType } from './enums';
import { workspaces } from './workspaces';

export const categories = pgTable(
  'categories',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: text('name').notNull(),
    type: categoryType('type').notNull(),
    icon: text('icon'),
    color: text('color'),
    isArchived: boolean('is_archived').notNull().default(false),
    ...timestamps()
  },
  (table) => [
    foreignKey({
      name: 'categories_parent_fk',
      columns: [table.workspaceId, table.parentId],
      foreignColumns: [table.workspaceId, table.id]
    }),
    unique('categories_workspace_parent_name_unique')
      .on(table.workspaceId, table.parentId, table.name)
      .nullsNotDistinct(),
    unique('categories_workspace_id_unique').on(table.workspaceId, table.id)
  ]
);
