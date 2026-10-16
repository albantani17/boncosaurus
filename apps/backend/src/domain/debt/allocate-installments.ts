import type { InstallmentStatus } from '@boncosaurus/shared';

type InstallmentLike = { sequence: number; dueDate: string; amount: number };

export type AllocatedInstallment<T extends InstallmentLike> = T & { paidAmount: number; status: InstallmentStatus };

/** Spreads what has been paid over the installments, oldest first. */
export function allocateInstallments<T extends InstallmentLike>(
  installments: T[],
  paidTotal: number,
  today: string
): AllocatedInstallment<T>[] {
  let unallocated = paidTotal;
  return [...installments]
    .sort((a, b) => a.sequence - b.sequence)
    .map((installment) => {
      const paidAmount = Math.min(unallocated, installment.amount);
      unallocated -= paidAmount;
      return { ...installment, paidAmount, status: statusOf(installment, paidAmount, today) };
    });
}

function statusOf(installment: InstallmentLike, paidAmount: number, today: string): InstallmentStatus {
  if (paidAmount >= installment.amount) return 'paid';
  if (installment.dueDate < today) return 'overdue';
  return paidAmount > 0 ? 'partial' : 'due';
}
