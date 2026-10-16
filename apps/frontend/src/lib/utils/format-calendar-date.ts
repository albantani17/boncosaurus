import { SHORT_MONTH_NAMES } from '../data/indonesian-calendar';

/** `2026-11-05` → `5 Nov 2026`. */
export function formatCalendarDate(value: string): string {
	const [year, month, day] = value.split('-').map(Number);
	return `${day} ${SHORT_MONTH_NAMES[month! - 1]} ${year}`;
}
