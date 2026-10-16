import type { DebtInstallment, DebtPayment, DebtWithCounterparty } from '../../types/debt.types';
import { type AllocatedInstallment, allocateInstallments } from './allocate-installments';
import { calculateDebtPosition, type DebtPosition } from './calculate-debt-position';

export type DebtView = DebtWithCounterparty & { installmentCount: number; position: DebtPosition };

export type DebtDetail = DebtView & {
  installments: AllocatedInstallment<DebtInstallment>[];
  payments: DebtPayment[];
};

export function buildDebtView(
  debt: DebtWithCounterparty,
  installments: DebtInstallment[],
  payments: DebtPayment[],
  today: string
): DebtView {
  return {
    ...debt,
    installmentCount: installments.length,
    position: calculateDebtPosition(debt, installments, payments, today)
  };
}

export function buildDebtDetail(
  debt: DebtWithCounterparty,
  installments: DebtInstallment[],
  payments: DebtPayment[],
  today: string
): DebtDetail {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    ...buildDebtView(debt, installments, payments, today),
    installments: allocateInstallments(installments, paid, today),
    payments
  };
}
