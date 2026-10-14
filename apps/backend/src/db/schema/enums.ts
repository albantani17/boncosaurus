import { pgEnum } from 'drizzle-orm/pg-core';

export const workspaceRole = pgEnum('workspace_role', ['owner', 'admin', 'member']);

export const accountType = pgEnum('account_type', [
  'cash',
  'bank',
  'ewallet',
  'credit_card',
  'investment',
  'other'
]);

export const categoryType = pgEnum('category_type', ['income', 'expense']);

export const transactionType = pgEnum('transaction_type', ['income', 'expense', 'transfer']);

export const transactionSource = pgEnum('transaction_source', ['manual', 'import', 'ai']);

export const aiProviderKind = pgEnum('ai_provider_kind', [
  'anthropic',
  'openai',
  'google',
  'openai_compatible'
]);

export const chatRole = pgEnum('chat_role', ['user', 'assistant']);
