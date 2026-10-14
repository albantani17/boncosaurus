import { describe, expect, test } from 'bun:test';
import { formatTransactionDate } from './format-transaction-date';

const now = new Date(2026, 9, 14, 12, 0);

describe('formatTransactionDate', () => {
	test('says "Hari ini" for the same day', () => {
		expect(formatTransactionDate(new Date(2026, 9, 14, 0, 5), now)).toBe('Hari ini');
	});

	test('says "Kemarin" for the previous day', () => {
		expect(formatTransactionDate(new Date(2026, 9, 13, 23, 59), now)).toBe('Kemarin');
	});

	test('uses day and short Indonesian month for older dates', () => {
		expect(formatTransactionDate(new Date(2026, 4, 3), now)).toBe('3 Mei');
	});
});
