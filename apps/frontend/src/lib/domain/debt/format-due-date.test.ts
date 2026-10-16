import { describe, expect, test } from 'bun:test';
import { formatDueDate } from './format-due-date';

const today = '2026-10-16';

describe('formatDueDate', () => {
	test('counts the days an installment is late', () => {
		expect(formatDueDate('2026-10-13', today)).toBe('Telat 3 hari');
	});

	test('says when it is due today or tomorrow', () => {
		expect(formatDueDate(today, today)).toBe('Jatuh tempo hari ini');
		expect(formatDueDate('2026-10-17', today)).toBe('Jatuh tempo besok');
	});

	test('counts down during the last week', () => {
		expect(formatDueDate('2026-10-23', today)).toBe('Jatuh tempo 7 hari lagi');
	});

	test('shows the date when it is further away', () => {
		expect(formatDueDate('2026-11-05', today)).toBe('Jatuh tempo 5 Nov 2026');
	});
});
