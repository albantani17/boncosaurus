import { foreignKey, index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { createdAt } from './columns';
import { chatConversations } from './chat-conversations';
import { chatRole } from './enums';
import { workspaces } from './workspaces';

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').notNull(),
    role: chatRole('role').notNull(),
    parts: jsonb('parts').$type<unknown[]>().notNull(),
    createdAt: createdAt()
  },
  (table) => [
    foreignKey({
      name: 'chat_messages_conversation_fk',
      columns: [table.workspaceId, table.conversationId],
      foreignColumns: [chatConversations.workspaceId, chatConversations.id]
    }).onDelete('cascade'),
    index('chat_messages_conversation_idx').on(table.conversationId, table.createdAt)
  ]
);
