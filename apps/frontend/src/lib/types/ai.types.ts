import type { TransactionType } from './api.types';

export type AiProviderKind = 'anthropic' | 'openai' | 'google' | 'openai_compatible';

export type AiProvider = {
	id: string;
	name: string;
	kind: AiProviderKind;
	baseUrl: string | null;
	apiKeyHint: string | null;
	hasApiKey: boolean;
	model: string;
	isDefault: boolean;
};

export type Conversation = {
	id: string;
	title: string | null;
	providerId: string | null;
	updatedAt: string;
};

export type StoredChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	parts: unknown[];
};

export type ConversationWithMessages = Conversation & { messages: StoredChatMessage[] };

export type TransactionProposalDraft = {
	type: TransactionType;
	accountId: string;
	toAccountId: string | null;
	categoryId: string | null;
	amount: number;
	toAmount: number | null;
	occurredAt: string;
	note: string | null;
};

export type TransactionProposal =
	| { status: 'pending'; draft: TransactionProposalDraft }
	| { status: 'saved'; draft: TransactionProposalDraft; transactionId: string }
	| { status: 'dismissed'; draft: TransactionProposalDraft }
	| { status: 'invalid'; code: string; message: string };
