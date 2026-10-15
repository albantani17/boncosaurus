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

export type TransactionProposalDraft = {
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amount: number;
  toAmount: number | null;
  fee?: number | null;
  occurredAt: string;
  note: string | null;
};

export type TransactionProposal =
  | { status: 'pending'; draft: TransactionProposalDraft }
  | { status: 'saved'; draft: TransactionProposalDraft; transactionId: string }
  | { status: 'dismissed'; draft: TransactionProposalDraft }
  | { status: 'invalid'; code: string; message: string };
