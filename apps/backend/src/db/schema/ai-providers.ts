import { sql } from 'drizzle-orm';
import { boolean, pgTable, text, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps, uuidV7Pk } from './columns';
import { aiProviderKind } from './enums';
import { workspaces } from './workspaces';

export const aiProviders = pgTable(
  'ai_providers',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: aiProviderKind('kind').notNull(),
    baseUrl: text('base_url'),
    apiKeyEncrypted: text('api_key_encrypted'),
    apiKeyHint: text('api_key_hint'),
    model: text('model').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps()
  },
  (table) => [
    unique('ai_providers_workspace_id_unique').on(table.workspaceId, table.id),
    unique('ai_providers_workspace_name_unique').on(table.workspaceId, table.name),
    uniqueIndex('ai_providers_one_default_idx')
      .on(table.workspaceId)
      .where(sql`${table.isDefault}`)
  ]
);
