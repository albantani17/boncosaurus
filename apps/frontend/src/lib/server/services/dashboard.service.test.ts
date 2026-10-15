import { describe, expect, test } from 'bun:test';
import type { Account, Category, PeriodSummary, Transaction } from '../../types/api.types';
import { loadDashboard } from './dashboard.service';

const now = new Date(2026, 9, 14, 12, 0);

const account: Account = {
	id: 'acc-1',
	name: 'BCA',
	type: 'bank',
	currency: 'IDR',
	initialBalance: 0,
	isArchived: false,
	balance: 1_000_000
};
const category: Category = { id: 'cat-1', name: 'Makanan', type: 'expense', parentId: null, isArchived: false };
const transaction: Transaction = {
	id: 'tx-1',
	type: 'expense',
	accountId: 'acc-1',
	toAccountId: null,
	categoryId: 'cat-1',
	amount: 25_000,
	toAmount: null,
	fee: null,
	occurredAt: new Date(2026, 9, 13, 8).toISOString(),
	note: 'sarapan'
};

const setup = (summary: Partial<PeriodSummary> = {}, overrides: { accounts?: Account[] } = {}) => {
	const paths: string[] = [];
	const responses: Record<string, unknown> = {
		'/accounts': overrides.accounts ?? [account],
		'/categories': [category],
		'/reports/summary': { from: '', to: '', totals: [], byCategory: [], ...summary },
		'/transactions': [transaction]
	};
	const client = {
		get: async <T>(path: string) => {
			paths.push(path);
			return responses[path.split('?')[0]!] as T;
		}
	};
	return { client, paths };
};

describe('loadDashboard', () => {
	test('requests the current month range and the latest eight transactions', async () => {
		const { client, paths } = setup();

		await loadDashboard({ client, baseCurrency: 'IDR', now });

		const summaryPath = paths.find((path) => path.startsWith('/reports/summary'))!;
		const query = new URLSearchParams(summaryPath.split('?')[1]);
		expect(new Date(query.get('from')!)).toEqual(new Date(2026, 9, 1));
		expect(paths).toContain('/transactions?limit=8');
	});

	test('falls back to zero totals when the month has no activity', async () => {
		const { client } = setup();

		const data = await loadDashboard({ client, baseCurrency: 'IDR', now });

		expect(data.monthTotals).toEqual({ currency: 'IDR', income: 0, expense: 0, net: 0 });
		expect(data.mascot).toBe('idle');
	});

	test('uses base currency totals for the cards and lists other currencies separately', async () => {
		const { client } = setup({
			totals: [
				{ currency: 'IDR', income: 500, expense: 100, net: 400 },
				{ currency: 'USD', income: 0, expense: 5, net: -5 }
			]
		});

		const data = await loadDashboard({ client, baseCurrency: 'IDR', now });

		expect(data.monthTotals.net).toBe(400);
		expect(data.otherCurrencyTotals).toEqual([{ currency: 'USD', income: 0, expense: 5, net: -5 }]);
		expect(data.mascot).toBe('happy');
	});

	test('labels recent transactions with account, category and relative date', async () => {
		const { client } = setup();

		const data = await loadDashboard({ client, baseCurrency: 'IDR', now });

		expect(data.recentTransactions[0]).toMatchObject({
			accountName: 'BCA',
			categoryName: 'Makanan',
			currency: 'IDR',
			dateLabel: 'Kemarin'
		});
	});

	test('hides archived accounts from the account list and the balance total', async () => {
		const { client } = setup({}, { accounts: [account, { ...account, id: 'old', isArchived: true }] });

		const data = await loadDashboard({ client, baseCurrency: 'IDR', now });

		expect(data.accounts).toHaveLength(1);
		expect(data.balances).toEqual([{ currency: 'IDR', balance: 1_000_000 }]);
	});

	test('builds the category breakdown from base currency expenses', async () => {
		const { client } = setup({
			byCategory: [{ categoryId: 'cat-1', type: 'expense', currency: 'IDR', total: 100 }]
		});

		const data = await loadDashboard({ client, baseCurrency: 'IDR', now });

		expect(data.breakdown).toEqual([{ label: 'Makanan', total: 100, percent: 100 }]);
	});
});
