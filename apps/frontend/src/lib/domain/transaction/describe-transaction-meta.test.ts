import { describe, expect, test } from 'bun:test';
import type { TransactionRowData } from '../../types/transaction-row.types';
import { describeTransactionMeta } from './describe-transaction-meta';

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
	occurredAt: new Date(2026, 9, 14, 8, 30).toISOString(),
	debtId: null,
	...overrides
});

describe('describeTransactionMeta', () => {
	test('shows account and time for a plain expense', () => {
		expect(describeTransactionMeta(row({}))).toBe('BCA · 08.30');
	});

	test('adds the category when the note already took the title', () => {
		expect(describeTransactionMeta(row({ note: 'Sarapan', categoryName: 'Makanan' }))).toBe('Makanan · BCA · 08.30');
	});

	test('leaves out the category when it is already the title', () => {
		expect(describeTransactionMeta(row({ categoryName: 'Makanan' }))).toBe('BCA · 08.30');
	});

	test('shows source and destination for a transfer', () => {
		expect(describeTransactionMeta(row({ type: 'transfer', toAccountName: 'Dompet' }))).toBe('BCA → Dompet · 08.30');
	});

	test('shows the admin fee of a transfer', () => {
		const transfer = row({ type: 'transfer', toAccountId: 'b', toAccountName: 'Dana', fee: 2500 });
		expect(describeTransactionMeta(transfer)).toBe('BCA → Dana · biaya Rp2.500 · 08.30');
	});
});
