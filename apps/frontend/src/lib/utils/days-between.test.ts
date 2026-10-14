import { describe, expect, test } from 'bun:test';
import { daysBetween } from './days-between';

describe('daysBetween', () => {
	test('is zero within the same calendar day', () => {
		expect(daysBetween(new Date(2026, 9, 14, 0, 1), new Date(2026, 9, 14, 23, 59))).toBe(0);
	});

	test('counts calendar days, not 24-hour periods', () => {
		expect(daysBetween(new Date(2026, 9, 13, 23, 59), new Date(2026, 9, 14, 0, 1))).toBe(1);
	});

	test('works across month boundaries', () => {
		expect(daysBetween(new Date(2026, 8, 30), new Date(2026, 9, 2))).toBe(2);
	});
});
