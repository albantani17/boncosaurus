import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { aiProviders } from './ai-providers';
import { timestamps, uuidV7Pk } from './columns';
import { users } from './users';
import { workspaces } from './workspaces';

export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    // Plain FK so deleting a provider can null only this column; services always look providers
    // up by workspace, so a conversation never uses another workspace's provider.
    providerId: uuid('provider_id').references(() => aiProviders.id, { onDelete: 'set null' }),
    ...timestamps()
  },
  (table) => [
    unique('chat_conversations_workspace_id_unique').on(table.workspaceId, table.id),
    index('chat_conversations_owner_idx').on(table.workspaceId, table.userId, table.updatedAt.desc())
  ]
);
