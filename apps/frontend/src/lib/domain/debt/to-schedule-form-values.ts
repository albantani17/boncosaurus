import type { DebtInstallment } from '../../types/api.types';

export type ScheduleFormValues = { enabled: boolean; firstDueDate: string; count: string; installmentAmount: string };

/** Prefills the schedule fields; an uneven schedule leaves the amount empty so it is split evenly again. */
export function toScheduleFormValues(installments: Pick<DebtInstallment, 'sequence' | 'dueDate' | 'amount'>[]): ScheduleFormValues {
	const [first] = [...installments].sort((a, b) => a.sequence - b.sequence);
	if (!first) return { enabled: false, firstDueDate: '', count: '3', installmentAmount: '' };

	const isEven = installments.every((installment) => installment.amount === first.amount);
	return {
		enabled: true,
		firstDueDate: first.dueDate,
		count: String(installments.length),
		installmentAmount: isEven ? String(first.amount) : ''
	};
}
