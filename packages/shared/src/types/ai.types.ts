import type { ChatRole } from '../constants/chat-roles';
import type { AiProviderKind } from '../constants/ai-provider-kinds';
import type { DebtDirection } from '../constants/debt-directions';
import type { TransactionType } from '../constants/transaction-types';
import type { CreateDebtBody, CreateDebtPaymentBody, TransactionSplitBody } from './debt.types';

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
  /** Expenses only: shares other people owe back. */
  splits?: TransactionSplitBody[];
};

/** A draft the assistant prepared; nothing is written until the user confirms it. */
export type Proposal<Draft, Saved> =
  | { status: 'pending'; draft: Draft }
  | ({ status: 'saved'; draft: Draft } & Saved)
  | { status: 'dismissed'; draft: Draft }
  | { status: 'invalid'; code: string; message: string };

export type TransactionProposal = Proposal<TransactionProposalDraft, { transactionId: string }>;

export type DebtProposalDraft = CreateDebtBody;
export type DebtProposal = Proposal<DebtProposalDraft, { debtId: string }>;

/** The payment plus what the card shows: whose debt it is and how it splits. */
export type DebtPaymentProposalDraft = CreateDebtPaymentBody & {
  debtId: string;
  debtTitle: string;
  counterpartyName: string;
  direction: DebtDirection;
  currency: string;
  principalAmount: number;
  extraAmount: number;
};
export type DebtPaymentProposal = Proposal<DebtPaymentProposalDraft, { debtId: string }>;

export type DebtWriteOffProposalDraft = {
  debtId: string;
  debtTitle: string;
  counterpartyName: string;
  direction: DebtDirection;
  currency: string;
  amount: number;
};
export type DebtWriteOffProposal = Proposal<DebtWriteOffProposalDraft, { debtId: string }>;

export type DraftReferenceBody = { messageId: string; toolCallId: string };
