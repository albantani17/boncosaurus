import { describe, expect, test } from 'bun:test';
import type { TransactionRepository } from '../repositories/transaction.repository';
import type { Account, Category, Transaction } from '../types/finance.types';
import { createTransactionService } from './transaction.service';

const now = new Date();
const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  workspaceId: 'ws',
  name: 'Cash',
  type: 'cash',
  currency: 'IDR',
  initialBalance: 0,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
});
const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  workspaceId: 'ws',
  parentId: null,
  name: 'Makanan',
  type: 'expense',
  icon: null,
  color: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});
const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  workspaceId: 'ws',
  type: 'expense',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: null,
  amount: 1000,
  toAmount: null,
  fee: null,
  occurredAt: now,
  note: null,
  source: 'manual',
  createdBy: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const setup = (
  options: {
    accounts?: Account[];
    categories?: Category[];
    existing?: Transaction;
    softDeleteResult?: boolean;
  } = {}
) => {
  const { accounts = [makeAccount()], categories = [], existing, softDeleteResult = true } = options;
  const inserted: unknown[] = [];
  const updates: unknown[] = [];
  const transactions: TransactionRepository = {
    list: async () => [],
    findById: async () => existing,
    insert: async (values) => {
      inserted.push(values);
      return makeTransaction(values as Partial<Transaction>);
    },
    update: async (_ws, _id, patch) => {
      updates.push(patch);
      return makeTransaction({ ...existing, ...patch });
    },
    softDelete: async () => softDeleteResult
  };
  const service = createTransactionService({
    transactions,
    accounts: { findById: async (_ws, id) => accounts.find((account) => account.id === id) },
    categories: { findById: async (_ws, id) => categories.find((category) => category.id === id) }
  });
  return { service, inserted, updates };
};

const expenseInput = {
  type: 'expense' as const,
  accountId: 'acc-1',
  amount: 1000,
  occurredAt: now
};

describe('previewTransaction', () => {
  test('validates a draft without inserting it', async () => {
    const { service, inserted } = setup();

    await service.previewTransaction('ws', expenseInput);

    expect(inserted).toEqual([]);
  });

  test('rejects a draft that references a missing account', async () => {
    const { service } = setup({ accounts: [] });

    await expect(service.previewTransaction('ws', expenseInput)).rejects.toMatchObject({ status: 404 });
  });
});

describe('createTransaction', () => {
  test('creates an expense in the given workspace', async () => {
    const { service, inserted } = setup();

    await service.createTransaction('ws-9', expenseInput);

    expect(inserted).toEqual([{ ...expenseInput, workspaceId: 'ws-9' }]);
  });

  test('throws not found when the account does not exist', async () => {
    const { service } = setup({ accounts: [] });

    await expect(service.createTransaction('ws', expenseInput)).rejects.toMatchObject({ status: 404 });
  });

  test('throws not found when the category does not exist', async () => {
    const { service } = setup();

    await expect(
      service.createTransaction('ws', { ...expenseInput, categoryId: 'nope' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('throws not found when the destination account does not exist', async () => {
    const { service } = setup();

    await expect(
      service.createTransaction('ws', { ...expenseInput, type: 'transfer', toAccountId: 'nope' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('rejects a category of the wrong type without inserting', async () => {
    const { service, inserted } = setup({ categories: [makeCategory({ type: 'income' })] });

    await expect(
      service.createTransaction('ws', { ...expenseInput, categoryId: 'cat-1' })
    ).rejects.toMatchObject({ code: 'CATEGORY_TYPE_MISMATCH' });
    expect(inserted).toHaveLength(0);
  });

  test('creates a same-currency transfer', async () => {
    const { service, inserted } = setup({
      accounts: [makeAccount(), makeAccount({ id: 'acc-2' })]
    });

    await service.createTransaction('ws', { ...expenseInput, type: 'transfer', toAccountId: 'acc-2' });

    expect(inserted).toHaveLength(1);
  });
});

describe('updateTransaction', () => {
  test('throws not found when the transaction does not exist', async () => {
    const { service } = setup();

    await expect(service.updateTransaction('ws', 'x', { amount: 5 })).rejects.toMatchObject({
      status: 404
    });
  });

  test('applies a partial patch after validating the merged result', async () => {
    const { service, updates } = setup({ existing: makeTransaction() });

    await service.updateTransaction('ws', 'tx-1', { amount: 2500 });

    expect(updates).toEqual([{ amount: 2500 }]);
  });

  test('rejects turning an expense into a transfer without a destination', async () => {
    const { service } = setup({ existing: makeTransaction() });

    await expect(
      service.updateTransaction('ws', 'tx-1', { type: 'transfer' })
    ).rejects.toMatchObject({ code: 'INVALID_TRANSFER_FIELDS' });
  });

  test('allows editing a transaction whose account was archived later', async () => {
    const { service, updates } = setup({
      accounts: [makeAccount({ isArchived: true })],
      existing: makeTransaction()
    });

    await service.updateTransaction('ws', 'tx-1', { note: 'koreksi' });

    expect(updates).toEqual([{ note: 'koreksi' }]);
  });

  test('rejects moving a transaction to an archived account', async () => {
    const { service } = setup({
      accounts: [makeAccount(), makeAccount({ id: 'acc-2', isArchived: true })],
      existing: makeTransaction()
    });

    await expect(
      service.updateTransaction('ws', 'tx-1', { accountId: 'acc-2' })
    ).rejects.toMatchObject({ code: 'ARCHIVED_REFERENCE' });
  });
});

describe('deleteTransaction', () => {
  test('soft deletes an existing transaction', async () => {
    const { service } = setup();

    await expect(service.deleteTransaction('ws', 'tx-1')).resolves.toBeUndefined();
  });

  test('throws not found when nothing was deleted', async () => {
    const { service } = setup({ softDeleteResult: false });

    await expect(service.deleteTransaction('ws', 'x')).rejects.toMatchObject({ status: 404 });
  });
});
