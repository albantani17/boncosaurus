import { describe, expect, test } from 'bun:test';
import { describeTransactionProposal } from './describe-transaction-proposal';

const accounts = [
	{ id: 'acc-1', name: 'Cash', currency: 'IDR' },
	{ id: 'acc-2', name: 'Wise', currency: 'USD' }
];
const categories = [
	{ id: 'cat-1', name: 'Makanan', parentId: null },
	{ id: 'cat-2', name: 'Kopi', parentId: 'cat-1' }
];
const draft = {
	type: 'expense' as const,
	accountId: 'acc-1',
	toAccountId: null,
	categoryId: 'cat-2',
	amount: 25_000,
	toAmount: null,
	occurredAt: '2026-10-14T02:00:00.000Z',
	note: null
};

describe('describeTransactionProposal', () => {
	test('resolves names and formats the amount in the account currency', () => {
		expect(describeTransactionProposal(draft, accounts, categories)).toMatchObject({
			amount: 'Rp25.000',
			toAmount: null,
			account: 'Cash',
			toAccount: null,
			category: 'Makanan › Kopi'
		});
	});

	test('describes a cross-currency transfer', () => {
		const transfer = { ...draft, type: 'transfer' as const, categoryId: null, toAccountId: 'acc-2', toAmount: 2 };
		expect(describeTransactionProposal(transfer, accounts, categories)).toMatchObject({
			toAccount: 'Wise',
			toAmount: 'USD 2',
			category: null
		});
	});

	test('flags references that no longer exist', () => {
		const missing = { ...draft, accountId: 'gone', categoryId: 'gone' };
		expect(describeTransactionProposal(missing, accounts, categories)).toMatchObject({
			account: 'Tidak ditemukan',
			category: 'Tidak ditemukan'
		});
	});
});
