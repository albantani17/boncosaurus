import type { DebtPositionDto } from '@boncosaurus/shared';
import type { Debt } from '../../types/debt.types';
import { allocateInstallments } from './allocate-installments';

type DebtLike = Pick<Debt, 'principal' | 'status' | 'dueDate'>;
type InstallmentLike = { sequence: number; dueDate: string; amount: number };
type PaymentLike = { amount: number; principalAmount: number };

export type DebtPosition = DebtPositionDto;

export function calculateDebtPosition(
  debt: DebtLike,
  installments: InstallmentLike[],
  payments: PaymentLike[],
  today: string
): DebtPosition {
  const scheduledTotal = installments.reduce((sum, installment) => sum + installment.amount, 0);
  const totalDue = Math.max(debt.principal, scheduledTotal);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const principalPaid = payments.reduce((sum, payment) => sum + payment.principalAmount, 0);
  const isActive = debt.status === 'active';

  const remaining = isActive ? Math.max(0, totalDue - paid) : 0;
  const nextDue = isActive ? findNextDue(debt, installments, paid, remaining, today) : null;
  return {
    totalDue,
    paid,
    remaining,
    principalRemaining: isActive ? Math.max(0, debt.principal - principalPaid) : 0,
    nextDueDate: nextDue?.date ?? null,
    nextDueAmount: nextDue?.amount ?? null,
    isOverdue: nextDue !== null && nextDue.date < today
  };
}

function findNextDue(
  debt: DebtLike,
  installments: InstallmentLike[],
  paid: number,
  remaining: number,
  today: string
): { date: string; amount: number } | null {
  if (installments.length === 0) return debt.dueDate ? { date: debt.dueDate, amount: remaining } : null;
  const open = allocateInstallments(installments, paid, today).find((installment) => installment.status !== 'paid');
  return open ? { date: open.dueDate, amount: open.amount - open.paidAmount } : null;
}
