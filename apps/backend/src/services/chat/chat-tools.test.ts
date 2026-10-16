import { describe, expect, test } from 'bun:test';
import { BadRequestError } from '../../errors/app-error';
import type { Category, Transaction, TransactionFilters } from '../../types/finance.types';
import type { AccountWithBalance } from '../account/account.service';
import { type ChatToolDependencies, createChatTools } from './chat-tools';
import type { CreateTransactionInput } from '../transaction/transaction.service';

const now = new Date('2026-10-14T08:00:00Z');
const options = { toolCallId: 'call-1', messages: [], context: {} };

const account: AccountWithBalance = {
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
  balance: 50_000
};

const category: Category = {
  id: 'cat-1',
  workspaceId: 'ws',
  parentId: null,
  name: 'Makanan',
  type: 'expense',
  icon: null,
  color: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now
};

const transaction: Transaction = {
  id: 'tx-1',
  workspaceId: 'ws',
  type: 'expense',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 25_000,
  toAmount: null,
  fee: null,
  occurredAt: now,
  note: 'Kopi',
  source: 'manual',
  createdBy: null,
  debtId: null,
  debtRole: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now
};

const notCalled = async (): Promise<never> => {
  throw new Error('not expected in these tests');
};

function setup(preview: (input: CreateTransactionInput) => Promise<void> = async () => {}) {
  const calls = {
    summary: [] as unknown[],
    list: [] as TransactionFilters[],
    preview: [] as CreateTransactionInput[],
    splitPreview: [] as unknown[]
  };
  const deps: ChatToolDependencies = {
    reports: {
      getSummary: async (_ws, range) => {
        calls.summary.push(range);
        return {
          ...range,
          totals: [{ currency: 'IDR', income: 0, expense: 25_000, net: -25_000 }],
          byCategory: [{ categoryId: 'cat-1', type: 'expense', currency: 'IDR', total: 25_000 }]
        };
      }
    },
    accounts: { listAccounts: async () => [account] },
    categories: { listCategories: async () => [category] },
    transactions: {
      listTransactions: async (_ws, filters) => {
        calls.list.push(filters);
        return [transaction];
      },
      previewTransaction: async (_ws, input) => {
        calls.preview.push(input);
        await preview(input);
      }
    },
    splitExpenses: {
      previewSplitExpense: async (_ws, input) => {
        calls.splitPreview.push(input);
        await preview(input);
      }
    },
    debts: { listDebts: notCalled, getDebt: notCalled, getSummary: notCalled, previewDebt: notCalled },
    debtPayments: { previewPayment: notCalled, previewWriteOff: notCalled }
  };
  return { tools: createChatTools(deps, 'ws'), calls };
}

describe('getSummary', () => {
  test('adds category names to the totals', async () => {
    const { tools } = setup();

    const result = await tools.getSummary.execute!(
      { from: '2026-10-01T00:00:00+07:00', to: '2026-10-31T23:59:59+07:00' },
      options
    );

    expect(result).toMatchObject({ byCategory: [{ categoryId: 'cat-1', categoryName: 'Makanan' }] });
  });

  test('returns an error for a date without an offset', async () => {
    const { tools, calls } = setup();

    const result = await tools.getSummary.execute!({ from: '2026-10-01', to: '2026-10-31T00:00:00Z' }, options);

    expect(result).toHaveProperty('error');
    expect(calls.summary).toEqual([]);
  });
});

describe('listAccounts', () => {
  test('returns the accounts with their balance', async () => {
    const { tools } = setup();

    expect(await tools.listAccounts.execute!({}, options)).toEqual([
      { id: 'acc-1', name: 'Cash', type: 'cash', currency: 'IDR', balance: 50_000, isArchived: false }
    ]);
  });
});

describe('listCategories', () => {
  test('returns the categories', async () => {
    const { tools } = setup();

    expect(await tools.listCategories.execute!({}, options)).toEqual([
      { id: 'cat-1', name: 'Makanan', type: 'expense', parentId: null, isArchived: false }
    ]);
  });
});

describe('searchTransactions', () => {
  test.each([
    [{ from: '2026-10-01' }, 'from'],
    [{ to: '2026-10-31' }, 'to']
  ])('returns an error for %p without an offset', async (input, field) => {
    const { tools, calls } = setup();

    const result = await tools.searchTransactions.execute!(input, options);

    expect(result).toEqual({ error: expect.stringMatching(new RegExp(`^${field} must be`)) });
    expect(calls.list).toEqual([]);
  });

  test('resolves account and category names and defaults the limit', async () => {
    const { tools, calls } = setup();

    const result = await tools.searchTransactions.execute!({ type: 'expense' }, options);

    expect(result).toEqual([
      expect.objectContaining({ id: 'tx-1', account: 'Cash', category: 'Makanan', note: 'Kopi' })
    ]);
    expect(calls.list[0]).toMatchObject({ type: 'expense', limit: 20, offset: 0 });
  });
});

describe('proposeTransaction', () => {
  const input = {
    type: 'expense' as const,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    amount: 25_000,
    occurredAt: '2026-10-14T09:00:00+07:00',
    note: ' Kopi '
  };

  test('returns a pending draft without saving anything', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeTransaction.execute!(input, options);

    expect(result).toEqual({
      status: 'pending',
      draft: {
        type: 'expense',
        accountId: 'acc-1',
        toAccountId: null,
        categoryId: 'cat-1',
        amount: 25_000,
        toAmount: null,
        fee: null,
        occurredAt: '2026-10-14T02:00:00.000Z',
        note: 'Kopi'
      }
    });
    expect(calls.preview).toHaveLength(1);
  });

  test('keeps the destination account and admin fee of a transfer', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeTransaction.execute!(
      { type: 'transfer', accountId: 'acc-1', toAccountId: 'acc-2', amount: 100_000, fee: 2_500, occurredAt: input.occurredAt },
      options
    );

    expect(result).toMatchObject({
      status: 'pending',
      draft: { type: 'transfer', toAccountId: 'acc-2', categoryId: null, amount: 100_000, fee: 2_500 }
    });
    expect(calls.preview[0]).toMatchObject({ fee: 2_500, toAccountId: 'acc-2' });
  });

  test('reports validation errors so the model can fix them', async () => {
    const { tools } = setup(async () => {
      throw new BadRequestError('CATEGORY_TYPE_MISMATCH', 'Category type does not match the transaction type');
    });

    const result = await tools.proposeTransaction.execute!(input, options);

    expect(result).toEqual({
      status: 'invalid',
      code: 'CATEGORY_TYPE_MISMATCH',
      message: 'Category type does not match the transaction type'
    });
  });

  test('rethrows unexpected errors', async () => {
    const { tools } = setup(async () => {
      throw new Error('database down');
    });

    expect(tools.proposeTransaction.execute!(input, options)).rejects.toThrow('database down');
  });

  test('rejects a date without an offset before validating', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeTransaction.execute!({ ...input, occurredAt: '2026-10-14 09:00' }, options);

    expect(result).toMatchObject({ status: 'invalid', code: 'INVALID_DATE' });
    expect(calls.preview).toEqual([]);
  });
});

describe('proposeTransaction with splits', () => {
  test('previews an expense shared with others through the split service', async () => {
    const { tools, calls } = setup();

    const result = await tools.proposeTransaction.execute!(
      {
        type: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        amount: 100_000,
        occurredAt: '2026-10-14T12:00:00+07:00',
        splits: [{ counterpartyName: 'Hani', amount: 60_000 }]
      },
      options
    );

    expect(result).toMatchObject({ status: 'pending', draft: { splits: [{ counterpartyName: 'Hani', amount: 60_000 }] } });
    expect(calls.preview).toEqual([]);
    expect(calls.splitPreview).toEqual([expect.objectContaining({ amount: 100_000, splits: [{ counterpartyName: 'Hani', amount: 60_000 }] })]);
  });

  test('leaves splits out of a draft that has none', async () => {
    const { tools } = setup();

    const result = await tools.proposeTransaction.execute!(
      { type: 'expense', accountId: 'acc-1', amount: 1, occurredAt: '2026-10-14T12:00:00+07:00', splits: [] },
      options
    );

    expect(result).toMatchObject({ status: 'pending' });
    expect((result as { draft: object }).draft).not.toHaveProperty('splits');
  });
});
