import { describe, expect, test } from 'bun:test';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
	test('formats rupiah with dot separators and no space', () => {
		expect(formatCurrency(2450000)).toBe('Rp2.450.000');
	});

	test('formats zero', () => {
		expect(formatCurrency(0)).toBe('Rp0');
	});

	test('puts the minus sign before the currency symbol', () => {
		expect(formatCurrency(-15000)).toBe('-Rp15.000');
	});

	test('prefixes other currencies with their code', () => {
		expect(formatCurrency(1200, 'USD')).toBe('USD 1.200');
	});
});
