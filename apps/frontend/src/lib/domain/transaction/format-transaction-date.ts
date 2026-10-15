import { SHORT_MONTH_NAMES } from '../../data/indonesian-calendar';
import { daysBetween } from '../../utils/days-between';

export function formatTransactionDate(value: Date, now: Date): string {
	const dayDifference = daysBetween(value, now);
	if (dayDifference === 0) return 'Hari ini';
	if (dayDifference === 1) return 'Kemarin';
	return `${value.getDate()} ${SHORT_MONTH_NAMES[value.getMonth()]}`;
}
