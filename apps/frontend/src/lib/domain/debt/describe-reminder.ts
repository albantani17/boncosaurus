import type { DebtReminder } from '../../types/api.types';

export type ReminderDescription = { action: string; when: string; isOverdue: boolean };

const describeWhen = (daysUntil: number) => {
	if (daysUntil < 0) return `Telat ${-daysUntil} hari`;
	if (daysUntil === 0) return 'Hari ini';
	if (daysUntil === 1) return 'Besok';
	return `${daysUntil} hari lagi`;
};

export function describeReminder({ direction, counterpartyName, daysUntil }: DebtReminder): ReminderDescription {
	return {
		action: `${direction === 'payable' ? 'Bayar ke' : 'Tagih'} ${counterpartyName}`,
		when: describeWhen(daysUntil),
		isOverdue: daysUntil < 0
	};
}
