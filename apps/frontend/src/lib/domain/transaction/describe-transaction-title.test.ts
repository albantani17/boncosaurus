import { describe, expect, test } from 'bun:test';
import type { TransactionRowData } from '../../types/transaction-row.types';
import { describeTransactionTitle } from './describe-transaction-title';

const row = (overrides: Partial<TransactionRowData>): TransactionRowData => ({
	id: 't',
	type: 'expense',
	amount: 1,
	toAmount: null,
	fee: null,
	currency: 'IDR',
	toCurrency: null,
	accountId: 'a',
	toAccountId: null,
	categoryId: null,
	accountName: 'BCA',
	toAccountName: null,
	categoryName: null,
	note: null,
	occurredAt: '2026-10-14T01:00:00.000Z',
	...overrides
});

describe('describeTransactionTitle', () => {
	test('prefers the note', () => {
		expect(describeTransactionTitle(row({ note: 'Kopi', categoryName: 'Makanan' }))).toBe('Kopi');
	});

	test('falls back to the category, then the type label', () => {
		expect(describeTransactionTitle(row({ categoryName: 'Makanan' }))).toBe('Makanan');
		expect(describeTransactionTitle(row({}))).toBe('Pengeluaran');
		expect(describeTransactionTitle(row({ type: 'income' }))).toBe('Pemasukan');
	});

	test('names the destination of a transfer without a note', () => {
		expect(describeTransactionTitle(row({ type: 'transfer', toAccountId: 'b', toAccountName: 'Dana' }))).toBe('Transfer ke Dana');
	});

	test('uses a plain label when the destination is unknown', () => {
		expect(describeTransactionTitle(row({ type: 'transfer' }))).toBe('Transfer');
	});
});
