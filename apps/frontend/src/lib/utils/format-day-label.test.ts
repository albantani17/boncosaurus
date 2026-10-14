import { describe, expect, test } from 'bun:test';
import { formatDayLabel } from './format-day-label';

const now = new Date(2026, 9, 14, 12);

describe('formatDayLabel', () => {
	test('says "Hari ini" and "Kemarin" for recent days', () => {
		expect(formatDayLabel(new Date(2026, 9, 14, 1), now)).toBe('Hari ini');
		expect(formatDayLabel(new Date(2026, 9, 13, 22), now)).toBe('Kemarin');
	});

	test('names the weekday for older days in the same year', () => {
		expect(formatDayLabel(new Date(2026, 9, 12), now)).toBe('Senin, 12 Okt');
	});

	test('adds the year for days in another year', () => {
		expect(formatDayLabel(new Date(2025, 11, 31), now)).toBe('Rabu, 31 Des 2025');
	});
});
