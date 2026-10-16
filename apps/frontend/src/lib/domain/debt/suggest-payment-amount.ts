import type { DebtDetail } from '../../types/api.types';

/** The next installment still open, or everything that remains when there is no schedule. */
export function suggestPaymentAmount(debt: Pick<DebtDetail, 'installments' | 'position'>): number {
	const open = debt.installments.find((installment) => installment.status !== 'paid');
	return open ? open.amount - open.paidAmount : debt.position.remaining;
}
