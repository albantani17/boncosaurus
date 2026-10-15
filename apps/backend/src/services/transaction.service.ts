import { NotFoundError } from '../errors/app-error';
import type { AccountRepository } from '../repositories/account.repository';
import type { CategoryRepository } from '../repositories/category.repository';
import type { TransactionRepository } from '../repositories/transaction.repository';
import type {
  NewTransaction,
  Transaction,
  TransactionFilters,
  TransactionPatch
} from '../types/finance.types';
import { mergeDefined } from '../utils/merge-defined';
import {
  type TransactionDraft,
  type TransactionReferences,
  validateTransaction
} from '../domain/transaction/validate-transaction';

export type CreateTransactionInput = Pick<
  NewTransaction,
  'type' | 'accountId' | 'amount' | 'occurredAt'
> &
  Partial<
    Pick<NewTransaction, 'toAccountId' | 'categoryId' | 'toAmount' | 'fee' | 'note' | 'source' | 'createdBy'>
  >;

type Dependencies = {
  transactions: TransactionRepository;
  accounts: Pick<AccountRepository, 'findById'>;
  categories: Pick<CategoryRepository, 'findById'>;
};

export function createTransactionService({ transactions, accounts, categories }: Dependencies) {
  async function resolveReferences(
    workspaceId: string,
    draft: TransactionDraft
  ): Promise<TransactionReferences> {
    const account = await accounts.findById(workspaceId, draft.accountId);
    if (!account) throw new NotFoundError('Account');

    const toAccount = draft.toAccountId
      ? await accounts.findById(workspaceId, draft.toAccountId)
      : undefined;
    if (draft.toAccountId && !toAccount) throw new NotFoundError('Destination account');

    const category = draft.categoryId
      ? await categories.findById(workspaceId, draft.categoryId)
      : undefined;
    if (draft.categoryId && !category) throw new NotFoundError('Category');

    return { account, toAccount, category };
  }

  async function assertValidInput(workspaceId: string, input: CreateTransactionInput): Promise<void> {
    const draft: TransactionDraft = {
      type: input.type,
      accountId: input.accountId,
      amount: input.amount,
      toAccountId: input.toAccountId ?? null,
      categoryId: input.categoryId ?? null,
      toAmount: input.toAmount ?? null,
      fee: input.fee ?? null
    };
    validateTransaction(draft, await resolveReferences(workspaceId, draft));
  }

  async function requireTransaction(workspaceId: string, id: string) {
    const transaction = await transactions.findById(workspaceId, id);
    if (!transaction) throw new NotFoundError('Transaction');
    return transaction;
  }

  return {
    listTransactions: (workspaceId: string, filters: TransactionFilters) =>
      transactions.list(workspaceId, filters),

    getTransaction: (workspaceId: string, id: string) => requireTransaction(workspaceId, id),

    previewTransaction: (workspaceId: string, input: CreateTransactionInput) =>
      assertValidInput(workspaceId, input),

    async createTransaction(
      workspaceId: string,
      input: CreateTransactionInput
    ): Promise<Transaction> {
      await assertValidInput(workspaceId, input);
      return transactions.insert({ ...input, workspaceId });
    },

    async updateTransaction(
      workspaceId: string,
      id: string,
      patch: TransactionPatch
    ): Promise<Transaction> {
      const existing = await requireTransaction(workspaceId, id);
      const merged = mergeDefined(existing, patch);

      const references = await resolveReferences(workspaceId, merged);
      const unchangedReferenceIds = [
        existing.accountId === merged.accountId ? existing.accountId : null,
        existing.toAccountId === merged.toAccountId ? existing.toAccountId : null,
        existing.categoryId === merged.categoryId ? existing.categoryId : null
      ].filter((id): id is string => id !== null);
      validateTransaction(merged, references, { allowArchivedIds: unchangedReferenceIds });

      const updated = await transactions.update(workspaceId, id, patch);
      if (!updated) throw new NotFoundError('Transaction');
      return updated;
    },

    async deleteTransaction(workspaceId: string, id: string): Promise<void> {
      const deleted = await transactions.softDelete(workspaceId, id);
      if (!deleted) throw new NotFoundError('Transaction');
    }
  };
}
