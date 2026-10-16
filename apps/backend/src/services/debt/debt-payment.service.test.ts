import { describe, expect, test } from 'bun:test';
import type { PaymentRecord } from '../../repositories/debt.repository';
import type { DebtInstallment, DebtPayment, DebtWithCounterparty } from '../../types/debt.types';
import { buildDebtDetail } from '../../domain/debt/build-debt-view';
import { createDebtPaymentService, type RecordPaymentInput } from './debt-payment.service';
import {
  createFakeDebtRepository,
  makeAccount,
  makeCategory,
  makeDebt,
  makeInstallment,
  makePayment
} from './debt-test-fixtures';

const today = '2026-10-16';
const closingTime = new Date('2026-10-16T05:00:00Z');

const setup = (options: { debt?: DebtWithCounterparty; installments?: DebtInstallment[]; payments?: DebtPayment[] } = {}) => {
  const { debt = makeDebt(), installments = [], payments = [] } = options;
  const fake = createFakeDebtRepository({ debts: [debt], installments, payments });
  let nextId = 0;
  const service = createDebtPaymentService({
    debts: fake.repository,
    debtService: {
      getDebt: async (_ws, id) => {
        if (id !== debt.id) throw Object.assign(new Error('Debt not found'), { status: 404 });
        return buildDebtDetail(debt, installments, payments, today);
      }
    },
    accounts: {
      findById: async (_ws, id) =>
        [makeAccount(), makeAccount({ id: 'acc-usd', currency: 'USD' })].find((account) => account.id === id)
    },
    categories: {
      findById: async (_ws, id) =>
        [makeCategory({ id: 'income-cat', type: 'income' }), makeCategory({ id: 'expense-cat' })].find((row) => row.id === id)
    },
    generateId: () => `id-${++nextId}`,
    now: () => closingTime
  });
  return { service, ...fake };
};

const payment = (overrides: Partial<RecordPaymentInput> = {}): RecordPaymentInput => ({
  accountId: 'acc-1',
  amount: 14_000,
  paidAt: new Date('2026-10-12T03:00:00Z'),
  createdBy: 'user-1',
  ...overrides
});

describe('recordPayment', () => {
  test('records a partial repayment as principal coming back in', async () => {
    const { service, writes } = setup();

    await service.recordPayment('ws', 'debt-1', payment());

    const [record] = writes.recordPayment as PaymentRecord[];
    expect(record!.payment).toMatchObject({
      id: 'id-1',
      amount: 14_000,
      principalAmount: 14_000,
      extraAmount: 0,
      repaymentTransactionId: 'id-2',
      chargeTransactionId: null,
      note: null
    });
    expect(record!.transactions).toEqual([
      {
        id: 'id-2',
        workspaceId: 'ws',
        type: 'income',
        accountId: 'acc-1',
        amount: 14_000,
        occurredAt: payment().paidAt,
        note: 'Pinjam',
        debtId: 'debt-1',
        debtRole: 'principal',
        createdBy: 'user-1'
      }
    ]);
    expect(record!.debtPatch).toEqual({ status: 'active', closedAt: null });
  });

  test('splits an overpayment into principal and a categorized charge, then settles', async () => {
    const { service, writes } = setup({ debt: makeDebt({ principal: 22_000 }) });

    await service.recordPayment('ws', 'debt-1', payment({ amount: 25_000, extraCategoryId: 'income-cat', note: 'kopi' }));

    const [record] = writes.recordPayment as PaymentRecord[];
    expect(record!.payment).toMatchObject({ principalAmount: 22_000, extraAmount: 3_000, chargeTransactionId: 'id-3' });
    expect(record!.transactions.map(({ amount, debtRole, categoryId, note }) => ({ amount, debtRole, categoryId, note }))).toEqual([
      { amount: 22_000, debtRole: 'principal', categoryId: undefined, note: 'kopi' },
      { amount: 3_000, debtRole: 'charge', categoryId: 'income-cat', note: 'kopi' }
    ]);
    expect(record!.debtPatch).toEqual({ status: 'settled', closedAt: payment().paidAt });
  });

  test('records interest past the principal as an uncategorized charge only', async () => {
    const debt = makeDebt({ direction: 'payable', principal: 300_000 });
    const installments = [1, 2, 3].map((sequence) => makeInstallment({ id: `i${sequence}`, sequence, amount: 105_000 }));
    const payments = [makePayment({ amount: 210_000, principalAmount: 210_000 }), makePayment({ id: 'p2', amount: 90_000, principalAmount: 90_000 })];
    const { service, writes } = setup({ debt, installments, payments });

    await service.recordPayment('ws', 'debt-1', payment({ amount: 15_000 }));

    const [record] = writes.recordPayment as PaymentRecord[];
    expect(record!.payment).toMatchObject({ principalAmount: 0, extraAmount: 15_000, repaymentTransactionId: null });
    expect(record!.transactions).toEqual([
      expect.objectContaining({ type: 'expense', amount: 15_000, debtRole: 'charge', categoryId: null })
    ]);
    expect(record!.debtPatch.status).toBe('settled');
  });

  test('rejects a payment from an account in another currency', async () => {
    const { service } = setup();
    await expect(service.recordPayment('ws', 'debt-1', payment({ accountId: 'acc-usd' }))).rejects.toMatchObject({
      code: 'CURRENCY_MISMATCH'
    });
  });

  test('rejects a charge category of the wrong type', async () => {
    const { service } = setup();
    await expect(
      service.recordPayment('ws', 'debt-1', payment({ extraCategoryId: 'expense-cat' }))
    ).rejects.toMatchObject({ code: 'CATEGORY_TYPE_MISMATCH' });
  });

  test.each([
    ['account', { accountId: 'missing' }],
    ['category', { extraCategoryId: 'missing' }]
  ])('throws not found for an unknown %s', async (_label, overrides) => {
    const { service } = setup();
    await expect(service.recordPayment('ws', 'debt-1', payment(overrides))).rejects.toMatchObject({ status: 404 });
  });
});

describe('deletePayment', () => {
  test('removes the payment and reopens a settled debt', async () => {
    const settled = makeDebt({ status: 'settled', closedAt: new Date() });
    const paid = makePayment({ amount: 30_000, principalAmount: 30_000 });
    const { service, writes } = setup({ debt: settled, payments: [paid] });

    await service.deletePayment('ws', 'debt-1', 'pay-1');

    expect(writes.deletePayment).toEqual([{ payment: paid, patch: { status: 'active', closedAt: null } }]);
  });

  test('throws not found for an unknown payment', async () => {
    const { service } = setup();
    await expect(service.deletePayment('ws', 'debt-1', 'x')).rejects.toMatchObject({ status: 404 });
  });

  test('keeps the payments of a written-off debt', async () => {
    const { service } = setup({ debt: makeDebt({ status: 'written_off' }), payments: [makePayment()] });
    await expect(service.deletePayment('ws', 'debt-1', 'pay-1')).rejects.toMatchObject({ code: 'DEBT_ALREADY_CLOSED' });
  });
});

describe('writeOff', () => {
  test('closes the debt with the principal still unpaid', async () => {
    const { service, writes } = setup({ payments: [makePayment({ amount: 14_000, principalAmount: 14_000 })] });

    await service.writeOff('ws', 'debt-1');

    expect(writes.update).toEqual([
      { id: 'debt-1', patch: { status: 'written_off', closedAt: closingTime, writtenOffAmount: 16_000 } }
    ]);
  });

  test('writes off leftover interest without a reportable amount', async () => {
    const installments = [makeInstallment({ amount: 35_000 })];
    const { service, writes } = setup({ installments, payments: [makePayment({ amount: 30_000, principalAmount: 30_000 })] });

    await service.writeOff('ws', 'debt-1');

    expect(writes.update).toEqual([
      { id: 'debt-1', patch: { status: 'written_off', closedAt: closingTime, writtenOffAmount: null } }
    ]);
  });

  test('refuses to write off a closed debt', async () => {
    const { service } = setup({ debt: makeDebt({ status: 'settled' }) });
    await expect(service.writeOff('ws', 'debt-1')).rejects.toMatchObject({ code: 'DEBT_ALREADY_CLOSED' });
  });
});

describe('previewPayment', () => {
  test('shows how a payment splits without saving it', async () => {
    const { service, writes } = setup({ debt: makeDebt({ principal: 22_000 }) });

    const preview = await service.previewPayment('ws', 'debt-1', payment({ amount: 25_000 }));

    expect(preview).toMatchObject({ principalAmount: 22_000, extraAmount: 3_000, debt: { id: 'debt-1' } });
    expect(writes.recordPayment).toEqual([]);
  });
});

describe('previewWriteOff', () => {
  test('shows the principal that would be given up', async () => {
    const { service, writes } = setup({ payments: [makePayment({ amount: 14_000, principalAmount: 14_000 })] });

    expect(await service.previewWriteOff('ws', 'debt-1')).toMatchObject({ amount: 16_000, debt: { id: 'debt-1' } });
    expect(writes.update).toEqual([]);
  });

  test('refuses a closed debt', async () => {
    const { service } = setup({ debt: makeDebt({ status: 'written_off' }) });
    await expect(service.previewWriteOff('ws', 'debt-1')).rejects.toMatchObject({ code: 'DEBT_ALREADY_CLOSED' });
  });
});
