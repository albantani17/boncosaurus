import { describe, expect, test } from 'bun:test';
import type { DebtCreation, DebtUpdate } from '../../repositories/debt.repository';
import type { DebtInstallment, DebtPayment, DebtWithCounterparty } from '../../types/debt.types';
import type { Account, Category, Transaction } from '../../types/finance.types';
import { type CreateDebtInput, createDebtService } from './debt.service';
import {
  createFakeDebtRepository,
  makeAccount,
  makeCategory,
  makeDebt,
  makeInstallment,
  makePayment,
  makeTransaction
} from './debt-test-fixtures';

const setup = (
  options: {
    debts?: DebtWithCounterparty[];
    installments?: DebtInstallment[];
    payments?: DebtPayment[];
    splitTotal?: number;
    accounts?: Account[];
    categories?: Category[];
    transactions?: Transaction[];
  } = {}
) => {
  const { accounts = [makeAccount()], categories = [makeCategory()], transactions = [makeTransaction()] } = options;
  const fake = createFakeDebtRepository(options);
  const resolved: unknown[] = [];
  let nextId = 0;
  const service = createDebtService({
    debts: fake.repository,
    counterparties: {
      resolveCounterparty: async (_ws, ref) => {
        resolved.push(ref);
        if (ref.counterpartyId) return { id: ref.counterpartyId };
        return { id: 'cp-new', created: { id: 'cp-new', workspaceId: 'ws', name: ref.counterpartyName!, kind: 'person' } };
      }
    },
    accounts: { findById: async (_ws, id) => accounts.find((row) => row.id === id) },
    categories: { findById: async (_ws, id) => categories.find((row) => row.id === id) },
    transactions: { findById: async (_ws, id) => transactions.find((row) => row.id === id) },
    generateId: () => `id-${++nextId}`,
    now: () => new Date('2026-10-16T03:00:00Z')
  });
  return { service, resolved, ...fake };
};

const lendCash: CreateDebtInput = {
  direction: 'receivable',
  sourceType: 'personal',
  origin: 'cash',
  counterpartyName: 'Sultan',
  title: '  Pinjamkan ke orang ',
  principal: 30_000,
  originatedAt: new Date('2026-10-10T03:00:00Z'),
  accountId: 'acc-1',
  createdBy: 'user-1'
};

const paylater: CreateDebtInput = {
  direction: 'payable',
  sourceType: 'paylater',
  origin: 'purchase',
  counterpartyName: 'Shopee PayLater',
  title: 'Sepatu',
  principal: 300_000,
  originatedAt: new Date('2026-10-15T03:00:00Z'),
  categoryId: 'cat-1',
  currency: 'IDR',
  schedule: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }
};

describe('listDebts', () => {
  test('attaches each debt its own installments and payments', async () => {
    const { service, listCalls } = setup({
      debts: [makeDebt(), makeDebt({ id: 'debt-2', principal: 45_000 })],
      installments: [makeInstallment({ debtId: 'debt-2', amount: 45_000 })],
      payments: [makePayment({ amount: 10_000 })]
    });

    const views = await service.listDebts('ws', { direction: 'receivable' });

    expect(views.map(({ id, installmentCount, position }) => ({ id, installmentCount, remaining: position.remaining }))).toEqual([
      { id: 'debt-1', installmentCount: 0, remaining: 20_000 },
      { id: 'debt-2', installmentCount: 1, remaining: 45_000 }
    ]);
    expect(listCalls).toEqual([{ direction: 'receivable' }]);
  });
});

describe('getSummary', () => {
  test('summarizes what remains on active debts', async () => {
    const { service, listCalls } = setup({ payments: [makePayment({ amount: 10_000 })] });

    expect(await service.getSummary('ws')).toEqual({
      totals: [{ currency: 'IDR', payable: 0, receivable: 20_000 }],
      activeCount: 1,
      overdueCount: 0
    });
    expect(listCalls).toEqual([{ status: 'active' }]);
  });
});

describe('getDebt', () => {
  test('returns the detail with allocated installments', async () => {
    const { service } = setup({ installments: [makeInstallment({ amount: 30_000 })], payments: [makePayment()] });

    const detail = await service.getDebt('ws', 'debt-1');

    expect(detail.installments[0]).toMatchObject({ paidAmount: 10_000, status: 'partial' });
    expect(detail.payments).toHaveLength(1);
  });

  test('throws not found for an unknown debt', async () => {
    const { service } = setup();
    await expect(service.getDebt('ws', 'x')).rejects.toMatchObject({ status: 404 });
  });
});

describe('createDebt', () => {
  test('records a cash loan with its disbursement out of the account', async () => {
    const { service, writes } = setup({ debts: [makeDebt({ id: 'id-1' })] });

    await service.createDebt('ws', lendCash);

    const [creation] = writes.create as DebtCreation[];
    expect(creation!.counterparty).toMatchObject({ name: 'Sultan' });
    expect(creation!.disbursement).toEqual({
      id: 'id-2',
      workspaceId: 'ws',
      type: 'expense',
      accountId: 'acc-1',
      amount: 30_000,
      occurredAt: lendCash.originatedAt,
      note: 'Pinjamkan ke orang',
      createdBy: 'user-1'
    });
    expect(creation!.debt).toMatchObject({
      id: 'id-1',
      reminderDays: 0,
      title: 'Pinjamkan ke orang',
      currency: 'IDR',
      counterpartyId: 'cp-new',
      disbursementTransactionId: 'id-2',
      dueDate: null
    });
    expect(creation!.installments).toEqual([]);
  });

  test('records money borrowed as income into the account', async () => {
    const { service, writes } = setup({ debts: [makeDebt({ id: 'id-1' })] });

    await service.createDebt('ws', { ...lendCash, direction: 'payable', dueDate: '2026-12-01' });

    const [creation] = writes.create as DebtCreation[];
    expect(creation!.disbursement?.type).toBe('income');
    expect(creation!.debt.dueDate).toBe('2026-12-01');
  });

  test('records a paylater purchase with its schedule and no money moving', async () => {
    const { service, writes } = setup({ debts: [makeDebt({ id: 'id-1' })] });

    await service.createDebt('ws', paylater);

    const [creation] = writes.create as DebtCreation[];
    expect(creation!.disbursement).toBeUndefined();
    expect(creation!.debt).toMatchObject({ categoryId: 'cat-1', currency: 'IDR', dueDate: '2027-01-05', reminderDays: 3 });
    expect(creation!.installments.map(({ id, debtId, sequence, amount }) => ({ id, debtId, sequence, amount }))).toEqual([
      { id: 'id-2', debtId: 'id-1', sequence: 1, amount: 105_000 },
      { id: 'id-3', debtId: 'id-1', sequence: 2, amount: 105_000 },
      { id: 'id-4', debtId: 'id-1', sequence: 3, amount: 105_000 }
    ]);
  });

  test('records a share of an existing expense in its currency', async () => {
    const { service, writes } = setup({ debts: [makeDebt({ id: 'id-1' })], splitTotal: 20_000 });

    await service.createDebt('ws', {
      direction: 'receivable',
      sourceType: 'personal',
      origin: 'split',
      counterpartyId: 'cp-1',
      title: 'Makan',
      principal: 60_000,
      originatedAt: new Date(),
      originTransactionId: 'tx-1'
    });

    const [creation] = writes.create as DebtCreation[];
    expect(creation!.counterparty).toBeUndefined();
    expect(creation!.debt).toMatchObject({ originTransactionId: 'tx-1', currency: 'IDR', counterpartyId: 'cp-1' });
  });

  test('rejects a share larger than what is left of the expense', async () => {
    const { service } = setup({ splitTotal: 50_000 });
    await expect(
      service.createDebt('ws', { ...lendCash, origin: 'split', accountId: null, originTransactionId: 'tx-1', principal: 60_000 })
    ).rejects.toMatchObject({ code: 'DEBT_SPLIT_EXCEEDS_TRANSACTION' });
  });

  test.each([
    ['account', { accountId: 'missing' }],
    ['category', { ...paylater, categoryId: 'missing' }],
    ['origin transaction', { origin: 'split' as const, accountId: null, originTransactionId: 'missing' }]
  ])('throws not found for an unknown %s', async (_label, overrides) => {
    const { service } = setup();
    await expect(service.createDebt('ws', { ...lendCash, ...overrides })).rejects.toMatchObject({ status: 404 });
  });
});

describe('previewDebt', () => {
  test('validates a debt without saving it', async () => {
    const { service, writes } = setup();

    await service.previewDebt('ws', { ...paylater, reminderDays: 7 });

    expect(writes.create).toEqual([]);
  });

  test('rejects what createDebt would reject', async () => {
    const { service } = setup();
    await expect(service.previewDebt('ws', { ...lendCash, accountId: 'missing' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('listReminders', () => {
  test('lists active debts due inside their reminder window', async () => {
    const { service, listCalls } = setup({
      debts: [
        makeDebt({ id: 'soon', dueDate: '2026-10-18', reminderDays: 3 }),
        makeDebt({ id: 'later', dueDate: '2026-10-30', reminderDays: 3 })
      ]
    });

    const reminders = await service.listReminders('ws');

    expect(reminders).toEqual([expect.objectContaining({ debtId: 'soon', amount: 30_000, daysUntil: 2 })]);
    expect(listCalls).toEqual([{ status: 'active' }]);
  });
});

describe('updateDebt', () => {
  test('updates the title and note without touching the schedule', async () => {
    const { service, writes } = setup();

    await service.updateDebt('ws', 'debt-1', { title: ' Pinjam lagi ', note: 'cicil' });

    const [update] = writes.update as (DebtUpdate & { id: string })[];
    expect(update!.patch).toMatchObject({ title: 'Pinjam lagi', note: 'cicil', principal: 30_000, status: 'active' });
    expect(update!.installments).toBeUndefined();
    expect(update!.disbursementAmount).toBeUndefined();
  });

  test('moves the disbursement along with a new principal', async () => {
    const { service, writes } = setup();

    await service.updateDebt('ws', 'debt-1', { principal: 50_000 });

    expect((writes.update as DebtUpdate[])[0]!.disbursementAmount).toBe(50_000);
  });

  test('refuses a new principal once payments exist', async () => {
    const { service } = setup({ payments: [makePayment()] });
    await expect(service.updateDebt('ws', 'debt-1', { principal: 50_000 })).rejects.toMatchObject({
      status: 409,
      code: 'DEBT_HAS_PAYMENTS'
    });
  });

  test('keeps a split within its expense when the principal grows', async () => {
    const split = makeDebt({ origin: 'split', originTransactionId: 'tx-1', disbursementTransactionId: null, principal: 60_000 });
    const { service } = setup({ debts: [split], splitTotal: 90_000 });

    await expect(service.updateDebt('ws', 'debt-1', { principal: 80_000 })).rejects.toMatchObject({
      code: 'DEBT_SPLIT_EXCEEDS_TRANSACTION'
    });
    await expect(service.updateDebt('ws', 'debt-1', { principal: 70_000 })).resolves.toBeDefined();
  });

  test('ignores a missing origin transaction when checking a split', async () => {
    const split = makeDebt({ origin: 'split', originTransactionId: 'gone', disbursementTransactionId: null });
    const { service } = setup({ debts: [split], splitTotal: 30_000 });

    await expect(service.updateDebt('ws', 'debt-1', { principal: 80_000 })).resolves.toBeDefined();
  });

  test('requires the schedule again when a scheduled principal changes', async () => {
    const { service } = setup({ installments: [makeInstallment({ amount: 30_000 })] });
    await expect(service.updateDebt('ws', 'debt-1', { principal: 50_000 })).rejects.toMatchObject({
      code: 'INVALID_SCHEDULE'
    });
  });

  test('replaces the schedule and moves the due date to the last installment', async () => {
    const { service, writes } = setup({ installments: [makeInstallment({ amount: 30_000 })] });

    await service.updateDebt('ws', 'debt-1', {
      principal: 40_000,
      schedule: { firstDueDate: '2026-11-01', count: 2 }
    });

    const [update] = writes.update as DebtUpdate[];
    expect(update!.patch.dueDate).toBe('2026-12-01');
    expect(update!.installments?.map((row) => row.amount)).toEqual([20_000, 20_000]);
  });

  test('removes the schedule when it is set to null', async () => {
    const { service, writes } = setup({ installments: [makeInstallment({ amount: 30_000 })] });

    await service.updateDebt('ws', 'debt-1', { schedule: null, dueDate: '2026-12-24' });

    const [update] = writes.update as DebtUpdate[];
    expect(update!.installments).toEqual([]);
    expect(update!.patch.dueDate).toBe('2026-12-24');
  });

  test('checks a new counterparty exists', async () => {
    const { service, resolved } = setup();

    await service.updateDebt('ws', 'debt-1', { counterpartyId: 'cp-2' });

    expect(resolved).toEqual([{ counterpartyId: 'cp-2' }]);
  });
});

describe('deleteDebt', () => {
  test('soft deletes an existing debt', async () => {
    const { service, writes } = setup();

    await service.deleteDebt('ws', 'debt-1');

    expect(writes.softDelete).toEqual(['debt-1']);
  });

  test('throws not found for an unknown debt', async () => {
    const { service } = setup();
    await expect(service.deleteDebt('ws', 'x')).rejects.toMatchObject({ status: 404 });
  });
});
