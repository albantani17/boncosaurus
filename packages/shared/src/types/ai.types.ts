import type { ChatRole } from '../constants/chat-roles';
import type { AiProviderKind } from '../constants/ai-provider-kinds';
import type { TransactionType } from '../constants/transaction-types';

export type AiProviderDto = {
  id: string;
  name: string;
  kind: AiProviderKind;
  baseUrl: string | null;
  apiKeyHint: string | null;
  hasApiKey: boolean;
  model: string;
  isDefault: boolean;
};

export type CreateAiProviderBody = {
  name: string;
  kind: AiProviderKind;
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
};

export type UpdateAiProviderBody = Partial<CreateAiProviderBody> & { clearApiKey?: boolean };

export type ConversationDto = {
  id: string;
  title: string | null;
  providerId: string | null;
  updatedAt: string;
};

export type StoredChatMessage = {
  id: string;
  role: ChatRole;
  parts: unknown[];
};

export type ConversationWithMessages = ConversationDto & { messages: StoredChatMessage[] };

export type TransactionProposalDraft = {
  type: TransactionType;
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

export type DraftReferenceBody = { messageId: string; toolCallId: string };
