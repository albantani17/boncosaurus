import type { accounts, categories, transactions } from '../db/schema';

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type AccountPatch = Partial<
  Pick<NewAccount, 'name' | 'type' | 'currency' | 'initialBalance' | 'isArchived' | 'sortOrder'>
>;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryPatch = Partial<Pick<NewCategory, 'name' | 'icon' | 'color' | 'isArchived'>>;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionPatch = Partial<
  Pick<
    Transaction,
    | 'type'
    | 'accountId'
    | 'toAccountId'
    | 'categoryId'
    | 'amount'
    | 'toAmount'
    | 'occurredAt'
    | 'note'
  >
>;

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  type?: Transaction['type'];
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
};

export type OutgoingTotals = {
  accountId: string;
  income: number;
  expense: number;
  transferOut: number;
};

export type IncomingTransferTotal = { accountId: string; transferIn: number };
