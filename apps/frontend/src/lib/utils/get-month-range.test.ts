import { describe, expect, test } from 'bun:test';
import { getMonthRange } from './get-month-range';

describe('getMonthRange', () => {
	test('spans the first to the last moment of the month', () => {
		const { from, to } = getMonthRange(new Date(2026, 9, 14, 15, 30));

		expect(from).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
		expect(to).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
	});

	test('handles february in a leap year', () => {
		expect(getMonthRange(new Date(2028, 1, 10)).to.getDate()).toBe(29);
	});

	test('handles december without rolling into the next year', () => {
		const { to } = getMonthRange(new Date(2026, 11, 31));

		expect(to.getFullYear()).toBe(2026);
		expect(to.getMonth()).toBe(11);
	});
});
