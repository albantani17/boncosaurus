import { describe, expect, test } from 'bun:test';
import { parseAmountInput } from './parse-amount-input';

describe('parseAmountInput', () => {
	test('reads plain digits', () => {
		expect(parseAmountInput('1250000')).toBe(1250000);
	});

	test('ignores thousand separators, spaces and the Rp prefix', () => {
		expect(parseAmountInput('Rp 1.250.000')).toBe(1250000);
	});

	test('rejects an empty value', () => {
		expect(parseAmountInput('')).toBeNull();
	});

	test('rejects decimals', () => {
		expect(parseAmountInput('12,5')).toBeNull();
	});

	test('rejects zero unless allowed', () => {
		expect(parseAmountInput('0')).toBeNull();
		expect(parseAmountInput('0', { allowZero: true })).toBe(0);
	});

	test('rejects negatives unless allowed', () => {
		expect(parseAmountInput('-500')).toBeNull();
		expect(parseAmountInput('-500', { allowNegative: true })).toBe(-500);
	});

	test('rejects numbers beyond the safe integer range', () => {
		expect(parseAmountInput('99999999999999999999')).toBeNull();
	});
});
