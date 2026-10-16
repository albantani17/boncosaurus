import { describe, expect, test } from 'bun:test';
import type { SplitExpenseCreation } from '../../repositories/debt.repository';
import type { CreateTransactionInput } from '../transaction/transaction.service';
import { type SplitExpenseInput, createSplitExpenseService } from './split-expense.service';
import { createFakeDebtRepository, makeAccount, makeTransaction } from './debt-test-fixtures';

const setup = (options: { previewError?: Error } = {}) => {
  const fake = createFakeDebtRepository();
  const previews: CreateTransactionInput[] = [];
  const known = new Map([['hani', 'cp-hani']]);
  let nextId = 0;
  const service = createSplitExpenseService({
    debts: fake.repository,
    transactions: { findById: async (_ws, id) => makeTransaction({ id }) },
    transactionService: {
      previewTransaction: async (_ws, input) => {
        previews.push(input);
        if (options.previewError) throw options.previewError;
      }
    },
    counterparties: {
      resolveCounterparty: async (_ws, ref) => {
        if (ref.counterpartyId) return { id: ref.counterpartyId };
        const name = ref.counterpartyName!.trim();
        const existing = known.get(name.toLowerCase());
        if (existing) return { id: existing };
        const id = `cp-${++nextId}`;
        return { id, created: { id, workspaceId: 'ws', name, kind: 'person' } };
      }
    },
    accounts: { findById: async (_ws, id) => (id === 'acc-1' ? makeAccount() : undefined) },
    generateId: () => `id-${++nextId}`
  });
  return { service, previews, writes: fake.writes };
};

const dinner = (overrides: Partial<SplitExpenseInput> = {}): SplitExpenseInput => ({
  type: 'expense',
  accountId: 'acc-1',
  categoryId: 'food',
  amount: 100_000,
  occurredAt: new Date('2026-10-13T12:00:00Z'),
  note: 'Makan bareng',
  createdBy: 'user-1',
  splits: [{ counterpartyName: 'Hani', amount: 60_000 }],
  ...overrides
});

describe('createSplitExpense', () => {
  test('saves the expense together with what each person owes', async () => {
    const { service, writes, previews } = setup();

    const transaction = await service.createSplitExpense('ws', dinner());

    const [creation] = writes.createSplitExpense as SplitExpenseCreation[];
    expect(previews).toHaveLength(1);
    expect(transaction.id).toBe(creation!.transaction.id!);
    expect(creation!.transaction).toMatchObject({ type: 'expense', amount: 100_000, workspaceId: 'ws' });
    expect(creation!.transaction).not.toHaveProperty('splits');
    expect(creation!.counterparties).toEqual([]);
    expect(creation!.debts).toEqual([
      expect.objectContaining({
        direction: 'receivable',
        origin: 'split',
        sourceType: 'personal',
        counterpartyId: 'cp-hani',
        title: 'Makan bareng',
        currency: 'IDR',
        principal: 60_000,
        dueDate: null,
        originTransactionId: creation!.transaction.id!,
        createdBy: 'user-1'
      })
    ]);
  });

  test('creates a new person once even when named twice', async () => {
    const { service, writes } = setup();

    await service.createSplitExpense(
      'ws',
      dinner({
        note: null,
        splits: [
          { counterpartyName: 'Roy', amount: 20_000, title: ' Es teh ', dueDate: '2026-10-20' },
          { counterpartyName: ' roy ', amount: 10_000 },
          { counterpartyId: 'cp-jo', amount: 10_000 }
        ]
      })
    );

    const [creation] = writes.createSplitExpense as SplitExpenseCreation[];
    expect(creation!.counterparties.map((row) => row.name)).toEqual(['Roy']);
    const roy = creation!.counterparties[0]!.id!;
    expect(creation!.debts.map(({ counterpartyId, title, dueDate }) => ({ counterpartyId, title, dueDate }))).toEqual([
      { counterpartyId: roy, title: 'Es teh', dueDate: '2026-10-20' },
      { counterpartyId: roy, title: 'Patungan', dueDate: null },
      { counterpartyId: 'cp-jo', title: 'Patungan', dueDate: null }
    ]);
  });

  test('rejects shares adding up to more than the expense', async () => {
    const { service, writes } = setup();
    await expect(
      service.createSplitExpense('ws', dinner({ splits: [{ counterpartyName: 'A', amount: 60_000 }, { counterpartyName: 'B', amount: 50_000 }] }))
    ).rejects.toMatchObject({ code: 'DEBT_SPLIT_EXCEEDS_TRANSACTION' });
    expect(writes.createSplitExpense).toEqual([]);
  });

  test('only splits expenses', async () => {
    const { service } = setup();
    await expect(service.createSplitExpense('ws', dinner({ type: 'income' }))).rejects.toMatchObject({
      code: 'INVALID_DEBT_ORIGIN'
    });
  });

  test('validates the expense like any other transaction', async () => {
    const { service } = setup({ previewError: new Error('invalid category') });
    await expect(service.createSplitExpense('ws', dinner())).rejects.toThrow('invalid category');
  });

  test('throws not found for an unknown account', async () => {
    const { service } = setup();
    await expect(service.createSplitExpense('ws', dinner({ accountId: 'missing' }))).rejects.toMatchObject({ status: 404 });
  });

  test('can be previewed without saving anything', async () => {
    const { service, writes } = setup();

    await service.previewSplitExpense('ws', dinner());

    expect(writes.createSplitExpense).toEqual([]);
  });
});
