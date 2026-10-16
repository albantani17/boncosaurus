import { daysBetween } from '../../utils/days-between';
import { formatCalendarDate } from '../../utils/format-calendar-date';

const SOON_DAYS = 7;

const toLocalDate = (value: string) => {
	const [year, month, day] = value.split('-').map(Number);
	return new Date(year!, month! - 1, day!);
};

/** How urgent a due date is, relative to today (both `YYYY-MM-DD`). */
export function formatDueDate(dueDate: string, today: string): string {
	const days = daysBetween(toLocalDate(today), toLocalDate(dueDate));
	if (days < 0) return `Telat ${-days} hari`;
	if (days === 0) return 'Jatuh tempo hari ini';
	if (days === 1) return 'Jatuh tempo besok';
	if (days <= SOON_DAYS) return `Jatuh tempo ${days} hari lagi`;
	return `Jatuh tempo ${formatCalendarDate(dueDate)}`;
}
