import { describe, expect, test } from 'bun:test';
import type { DebtInstallment, DebtPayment, DebtWithCounterparty } from '../../types/debt.types';
import { buildDebtDetail, buildDebtView } from './build-debt-view';

const debt = { id: 'debt', principal: 300_000, status: 'active', dueDate: null } as DebtWithCounterparty;
const installment = (sequence: number, dueDate: string) => ({ sequence, dueDate, amount: 150_000 }) as DebtInstallment;
const installments = [installment(1, '2026-11-05'), installment(2, '2026-12-05')];
const payments = [{ amount: 200_000, principalAmount: 200_000 } as DebtPayment];

describe('buildDebtView', () => {
  test('adds the installment count and position to the debt', () => {
    const view = buildDebtView(debt, installments, payments, '2026-10-16');
    expect(view).toMatchObject({ id: 'debt', installmentCount: 2, position: { remaining: 100_000, nextDueDate: '2026-12-05' } });
  });
});

describe('buildDebtDetail', () => {
  test('adds allocated installments and the payment history', () => {
    const detail = buildDebtDetail(debt, installments, payments, '2026-10-16');
    expect(detail.installments.map(({ paidAmount, status }) => ({ paidAmount, status }))).toEqual([
      { paidAmount: 150_000, status: 'paid' },
      { paidAmount: 50_000, status: 'partial' }
    ]);
    expect(detail.payments).toBe(payments);
  });
});
