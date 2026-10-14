import { describe, expect, test } from 'bun:test';
import { formatMonthLabel } from './format-month-label';

describe('formatMonthLabel', () => {
	test('writes the Indonesian month name and year', () => {
		expect(formatMonthLabel(new Date(2026, 9, 14))).toBe('Oktober 2026');
	});

	test('covers the first and last month of the year', () => {
		expect(formatMonthLabel(new Date(2026, 0, 1))).toBe('Januari 2026');
		expect(formatMonthLabel(new Date(2026, 11, 31))).toBe('Desember 2026');
	});
});
