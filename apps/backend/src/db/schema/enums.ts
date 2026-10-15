import {
  ACCOUNT_TYPES,
  AI_PROVIDER_KINDS,
  CATEGORY_TYPES,
  CHAT_ROLES,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  WORKSPACE_ROLES
} from '@boncosaurus/shared';
import { pgEnum } from 'drizzle-orm/pg-core';

export const workspaceRole = pgEnum('workspace_role', WORKSPACE_ROLES);

export const accountType = pgEnum('account_type', ACCOUNT_TYPES);

export const categoryType = pgEnum('category_type', CATEGORY_TYPES);

export const transactionType = pgEnum('transaction_type', TRANSACTION_TYPES);

export const transactionSource = pgEnum('transaction_source', TRANSACTION_SOURCES);

export const aiProviderKind = pgEnum('ai_provider_kind', AI_PROVIDER_KINDS);

export const chatRole = pgEnum('chat_role', CHAT_ROLES);
