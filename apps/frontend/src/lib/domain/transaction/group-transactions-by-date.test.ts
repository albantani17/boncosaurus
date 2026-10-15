import { describe, expect, test } from 'bun:test';
import type { TransactionRowData } from '../../types/transaction-row.types';
import { groupTransactionsByDate } from './group-transactions-by-date';

const now = new Date(2026, 9, 14, 12);
const row = (id: string, occurredAt: Date): TransactionRowData => ({
	id,
	type: 'expense',
	amount: 1,
	toAmount: null,
	fee: null,
	currency: 'IDR',
	toCurrency: null,
	accountId: 'a',
	toAccountId: null,
	categoryId: null,
	accountName: 'Kas',
	toAccountName: null,
	categoryName: null,
	note: null,
	occurredAt: occurredAt.toISOString()
});

describe('groupTransactionsByDate', () => {
	test('puts transactions of the same day in one labelled group', () => {
		const groups = groupTransactionsByDate(
			[row('1', new Date(2026, 9, 14, 9)), row('2', new Date(2026, 9, 14, 7)), row('3', new Date(2026, 9, 13, 20))],
			now
		);

		expect(groups.map((group) => [group.label, group.rows.map((item) => item.id)])).toEqual([
			['Hari ini', ['1', '2']],
			['Kemarin', ['3']]
		]);
	});

	test('keeps the incoming order of rows and groups', () => {
		const groups = groupTransactionsByDate([row('old', new Date(2026, 9, 1)), row('new', new Date(2026, 9, 10))], now);

		expect(groups.map((group) => group.rows[0]!.id)).toEqual(['old', 'new']);
	});

	test('merges rows of the same day even when they are not adjacent', () => {
		const groups = groupTransactionsByDate(
			[row('a', new Date(2026, 9, 3, 9)), row('b', new Date(2026, 9, 2)), row('c', new Date(2026, 9, 3, 7))],
			now
		);

		expect(groups.map((group) => group.rows.map((item) => item.id))).toEqual([['a', 'c'], ['b']]);
	});

	test('returns no groups for no rows', () => {
		expect(groupTransactionsByDate([], now)).toEqual([]);
	});
});
