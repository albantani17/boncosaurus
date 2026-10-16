import { describe, expect, test } from 'bun:test';
import { formatCalendarDate } from './format-calendar-date';

describe('formatCalendarDate', () => {
	test('formats a calendar date with a short Indonesian month', () => {
		expect(formatCalendarDate('2026-11-05')).toBe('5 Nov 2026');
		expect(formatCalendarDate('2027-01-31')).toBe('31 Jan 2027');
	});
});
