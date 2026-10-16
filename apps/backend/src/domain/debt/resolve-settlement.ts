import type { Debt, DebtPatch } from '../../types/debt.types';
import { calculateDebtPosition } from './calculate-debt-position';

type DebtLike = Pick<Debt, 'status' | 'closedAt' | 'principal' | 'dueDate'>;
type InstallmentLike = { sequence: number; dueDate: string; amount: number };
type PaymentLike = { amount: number; principalAmount: number; paidAt: Date };

/** Settles a debt once everything due is paid, and reopens it when a payment is removed. */
export function resolveSettlement(debt: DebtLike, installments: InstallmentLike[], payments: PaymentLike[]): DebtPatch {
  if (debt.status === 'written_off') return {};

  const { remaining } = calculateDebtPosition({ ...debt, status: 'active' }, installments, payments, '');
  if (remaining > 0) return { status: 'active', closedAt: null };

  if (debt.status === 'settled') return { status: 'settled', closedAt: debt.closedAt };
  const lastPaidAt = payments.reduce<Date | null>((latest, { paidAt }) => (!latest || paidAt > latest ? paidAt : latest), null);
  return { status: 'settled', closedAt: lastPaidAt };
}
