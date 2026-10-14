import { SHORT_MONTH_NAMES, WEEKDAY_NAMES } from '../data/indonesian-calendar';
import { daysBetween } from './days-between';

export function formatDayLabel(value: Date, now: Date): string {
	const dayDifference = daysBetween(value, now);
	if (dayDifference === 0) return 'Hari ini';
	if (dayDifference === 1) return 'Kemarin';

	const label = `${WEEKDAY_NAMES[value.getDay()]}, ${value.getDate()} ${SHORT_MONTH_NAMES[value.getMonth()]}`;
	return value.getFullYear() === now.getFullYear() ? label : `${label} ${value.getFullYear()}`;
}
