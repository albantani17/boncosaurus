import { describe, expect, test } from 'bun:test';
import type { Account } from '../../types/api.types';
import { sumBalancesByCurrency } from './sum-balances-by-currency';

const makeAccount = (overrides: Partial<Account>): Account => ({
	id: 'a',
	name: 'Kas',
	type: 'cash',
	currency: 'IDR',
	initialBalance: 0,
	isArchived: false,
	balance: 0,
	...overrides
});

describe('sumBalancesByCurrency', () => {
	test('adds balances of accounts with the same currency', () => {
		const result = sumBalancesByCurrency([makeAccount({ balance: 100 }), makeAccount({ balance: 50 })]);

		expect(result).toEqual([{ currency: 'IDR', balance: 150 }]);
	});

	test('keeps different currencies apart', () => {
		const result = sumBalancesByCurrency([
			makeAccount({ balance: 100 }),
			makeAccount({ currency: 'USD', balance: 5 })
		]);

		expect(result).toEqual([
			{ currency: 'IDR', balance: 100 },
			{ currency: 'USD', balance: 5 }
		]);
	});

	test('skips archived accounts', () => {
		expect(sumBalancesByCurrency([makeAccount({ balance: 100, isArchived: true })])).toEqual([]);
	});

	test('returns an empty list without accounts', () => {
		expect(sumBalancesByCurrency([])).toEqual([]);
	});
});
