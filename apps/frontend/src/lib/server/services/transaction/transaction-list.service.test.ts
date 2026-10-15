import { describe, expect, test } from 'bun:test';
import type { Transaction } from '../../../types/api.types';
import { TRANSACTIONS_PAGE_SIZE, loadTransactionPage } from './transaction-list.service';

const filters = { type: '' as const, accountId: '', categoryId: '', month: '2026-10' };
const transaction = (id: number): Transaction => ({
	id: `t${id}`,
	type: 'expense',
	accountId: 'a',
	toAccountId: null,
	categoryId: null,
	amount: 1,
	toAmount: null,
	fee: null,
	occurredAt: '2026-10-14T01:00:00.000Z',
	note: null
});

const setup = (transactionCount: number) => {
	const paths: string[] = [];
	const client = {
		get: async <T>(path: string) => {
			paths.push(path);
			if (path.startsWith('/transactions')) {
				return Array.from({ length: transactionCount }, (_, index) => transaction(index)) as T;
			}
			return [] as T;
		}
	};
	return { client, paths };
};

describe('loadTransactionPage', () => {
	test('asks for one row more than a page to detect the next page', async () => {
		const { client, paths } = setup(0);

		await loadTransactionPage(client, filters, 100);

		const query = new URLSearchParams(paths.find((path) => path.startsWith('/transactions'))!.split('?')[1]);
		expect(query.get('limit')).toBe(String(TRANSACTIONS_PAGE_SIZE + 1));
		expect(query.get('offset')).toBe('100');
	});

	test('returns a full page and flags more rows when the extra row came back', async () => {
		const { client } = setup(TRANSACTIONS_PAGE_SIZE + 1);

		const page = await loadTransactionPage(client, filters, 0);

		expect(page.rows).toHaveLength(TRANSACTIONS_PAGE_SIZE);
		expect(page.hasMore).toBe(true);
	});

	test('reports no more rows on the last page', async () => {
		const { client } = setup(3);

		const page = await loadTransactionPage(client, filters, 0);

		expect(page.rows).toHaveLength(3);
		expect(page.hasMore).toBe(false);
	});
});
