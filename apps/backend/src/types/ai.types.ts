import type { aiProviders, chatConversations, chatMessages } from '../db/schema';

export type AiProviderRecord = typeof aiProviders.$inferSelect;
export type NewAiProvider = typeof aiProviders.$inferInsert;
export type AiProviderKind = AiProviderRecord['kind'];
export type AiProviderPatch = Partial<
  Pick<NewAiProvider, 'name' | 'kind' | 'baseUrl' | 'apiKeyEncrypted' | 'apiKeyHint' | 'model'>
>;

export type PublicAiProvider = Omit<AiProviderRecord, 'apiKeyEncrypted'> & { hasApiKey: boolean };

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
export type ChatConversationPatch = Partial<Pick<NewChatConversation, 'title' | 'providerId'>>;

export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type NewChatMessage = Omit<typeof chatMessages.$inferInsert, 'createdAt'>;

export type { TransactionProposal, TransactionProposalDraft } from '@boncosaurus/shared';
