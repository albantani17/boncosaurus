import { describe, expect, test } from 'bun:test';
import { readTransactionFilters, toMonthValue, toTransactionQuery } from './transaction-filters';

const now = new Date(2026, 9, 14);
const ACCOUNT_ID = '01a13ae8-1cb0-700b-86f1-b08abcf593ef';

describe('readTransactionFilters', () => {
	test('reads valid filters from the URL', () => {
		const params = new URLSearchParams({ type: 'expense', accountId: ACCOUNT_ID, month: '2026-09' });

		expect(readTransactionFilters(params, now)).toEqual({
			type: 'expense',
			accountId: ACCOUNT_ID,
			categoryId: '',
			month: '2026-09'
		});
	});

	test('defaults to the current month and no filters', () => {
		expect(readTransactionFilters(new URLSearchParams(), now)).toEqual({
			type: '',
			accountId: '',
			categoryId: '',
			month: '2026-10'
		});
	});

	test('drops invalid values instead of failing', () => {
		const params = new URLSearchParams({ type: 'gift', accountId: 'abc', month: '2026-13' });

		expect(readTransactionFilters(params, now)).toEqual({ type: '', accountId: '', categoryId: '', month: '2026-10' });
	});
});

describe('toTransactionQuery', () => {
	test('turns the month into a from/to range and adds paging', () => {
		const query = toTransactionQuery(
			{ type: 'income', accountId: '', categoryId: '', month: '2026-02' },
			{ limit: 51, offset: 50 }
		);

		expect(new Date(query.get('from')!)).toEqual(new Date(2026, 1, 1));
		expect(new Date(query.get('to')!)).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
		expect(query.get('type')).toBe('income');
		expect(query.get('limit')).toBe('51');
		expect(query.get('offset')).toBe('50');
		expect(query.has('accountId')).toBe(false);
	});
});

describe('toMonthValue', () => {
	test('formats year and zero-padded month', () => {
		expect(toMonthValue(new Date(2026, 0, 5))).toBe('2026-01');
	});
});
