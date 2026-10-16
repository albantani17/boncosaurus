import { describe, expect, test } from 'bun:test';
import type { Account, Category, Transaction } from '../../../types/api.types';
import { toTransactionRow } from './to-transaction-row';

const account = (id: string, name: string, currency = 'IDR'): Account => ({
	id,
	name,
	type: 'bank',
	currency,
	initialBalance: 0,
	isArchived: false,
	balance: 0
});
const accounts = new Map([
	['a', account('a', 'BCA')],
	['u', account('u', 'Wise', 'USD')]
]);
const categories = new Map<string, Category>([
	['c', { id: 'c', name: 'Makanan', type: 'expense', parentId: null, isArchived: false }]
]);
const transaction = (overrides: Partial<Transaction>): Transaction => ({
	id: 't',
	type: 'expense',
	accountId: 'a',
	toAccountId: null,
	categoryId: 'c',
	amount: 100,
	toAmount: null,
	fee: null,
	occurredAt: '2026-10-14T01:00:00.000Z',
	note: null,
	debtId: null,
	debtRole: null,
	...overrides
});

describe('toTransactionRow', () => {
	test('labels an expense with account and category names', () => {
		expect(toTransactionRow(transaction({}), accounts, categories)).toMatchObject({
			accountName: 'BCA',
			categoryName: 'Makanan',
			currency: 'IDR',
			toAccountName: null,
			toCurrency: null
		});
	});

	test('adds destination name and currency for a transfer', () => {
		const row = toTransactionRow(
			transaction({ type: 'transfer', toAccountId: 'u', categoryId: null, toAmount: 5 }),
			accounts,
			categories
		);

		expect(row).toMatchObject({ toAccountName: 'Wise', toCurrency: 'USD', toAmount: 5 });
	});

	test('falls back when referenced records are missing', () => {
		const row = toTransactionRow(transaction({ accountId: 'gone', categoryId: 'gone' }), accounts, categories);

		expect(row).toMatchObject({ accountName: '-', categoryName: null, currency: 'IDR' });
	});

	test('keeps the debt a transaction belongs to', () => {
		expect(toTransactionRow(transaction({ debtId: 'debt-1', debtRole: 'principal' }), accounts, categories).debtId).toBe('debt-1');
	});
});
