import { describe, expect, test } from 'bun:test';
import type { DebtDetail } from '../../domain/debt/build-debt-view';
import type { Transaction } from '../../types/finance.types';
import { createProposalActions } from './proposal-actions';

const actor = { userId: 'u1', workspaceId: 'ws' };
const transactionDraft = {
  type: 'expense' as const,
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 100_000,
  toAmount: null,
  occurredAt: '2026-10-14T05:00:00.000Z',
  note: 'Makan'
};

function setup() {
  const calls: Record<string, unknown[]> = { transaction: [], split: [], debt: [], payment: [], writeOff: [] };
  const actions = createProposalActions({
    transactions: {
      createTransaction: async (ws, input) => {
        calls.transaction!.push({ ws, ...input });
        return { id: 'tx-1' } as Transaction;
      }
    },
    splitExpenses: {
      createSplitExpense: async (ws, input) => {
        calls.split!.push({ ws, ...input });
        return { id: 'tx-2' } as Transaction;
      }
    },
    debts: {
      createDebt: async (ws, input) => {
        calls.debt!.push({ ws, ...input });
        return { id: 'debt-new' } as DebtDetail;
      }
    },
    debtPayments: {
      recordPayment: async (ws, debtId, input) => {
        calls.payment!.push({ ws, debtId, ...input });
        return {} as DebtDetail;
      },
      writeOff: async (ws, debtId) => {
        calls.writeOff!.push({ ws, debtId });
        return {} as DebtDetail;
      }
    }
  });
  return { actions, calls };
}

describe('createProposalActions', () => {
  test('creates a confirmed transaction as an AI transaction', async () => {
    const { actions, calls } = setup();

    expect(await actions.save(actor, 'proposeTransaction', transactionDraft)).toEqual({ transactionId: 'tx-1' });
    expect(calls.transaction).toEqual([
      { ws: 'ws', ...transactionDraft, occurredAt: new Date(transactionDraft.occurredAt), source: 'ai', createdBy: 'u1' }
    ]);
  });

  test('creates an expense with shares through the split service', async () => {
    const { actions, calls } = setup();
    const splits = [{ counterpartyName: 'Hani', amount: 60_000 }];

    expect(await actions.save(actor, 'proposeTransaction', { ...transactionDraft, splits })).toEqual({ transactionId: 'tx-2' });
    expect(calls.split).toEqual([expect.objectContaining({ splits, source: 'ai', createdBy: 'u1' })]);
    expect(calls.transaction).toEqual([]);
  });

  test('creates a confirmed debt', async () => {
    const { actions, calls } = setup();
    const draft = {
      direction: 'receivable',
      sourceType: 'personal',
      origin: 'cash',
      counterpartyName: 'Sultan',
      title: 'Pinjam',
      principal: 30_000,
      originatedAt: '2026-10-10T02:00:00.000Z',
      accountId: 'acc-1'
    };

    expect(await actions.save(actor, 'proposeDebt', draft)).toEqual({ debtId: 'debt-new' });
    expect(calls.debt).toEqual([{ ws: 'ws', ...draft, originatedAt: new Date(draft.originatedAt), createdBy: 'u1' }]);
  });

  test('records a confirmed payment with only the payment fields', async () => {
    const { actions, calls } = setup();
    const draft = {
      debtId: 'debt-1',
      debtTitle: 'Pinjam',
      counterpartyName: 'Sultan',
      direction: 'receivable',
      currency: 'IDR',
      principalAmount: 14_000,
      extraAmount: 0,
      accountId: 'acc-1',
      amount: 14_000,
      paidAt: '2026-10-12T02:00:00.000Z',
      extraCategoryId: null,
      note: null
    };

    expect(await actions.save(actor, 'proposeDebtPayment', draft)).toEqual({ debtId: 'debt-1' });
    expect(calls.payment).toEqual([
      {
        ws: 'ws',
        debtId: 'debt-1',
        accountId: 'acc-1',
        amount: 14_000,
        paidAt: new Date(draft.paidAt),
        extraCategoryId: null,
        note: null,
        createdBy: 'u1'
      }
    ]);
  });

  test('writes off a confirmed debt', async () => {
    const { actions, calls } = setup();

    expect(await actions.save(actor, 'proposeDebtWriteOff', { debtId: 'debt-1' })).toEqual({ debtId: 'debt-1' });
    expect(calls.writeOff).toEqual([{ ws: 'ws', debtId: 'debt-1' }]);
  });
});
