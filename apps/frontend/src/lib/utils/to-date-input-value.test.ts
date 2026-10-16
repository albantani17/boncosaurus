import { describe, expect, test } from 'bun:test';
import { toDateInputValue } from './to-date-input-value';

describe('toDateInputValue', () => {
	test('formats the local day with zero padding', () => {
		expect(toDateInputValue(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
	});
});
