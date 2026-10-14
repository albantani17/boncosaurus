import type { Account, Category, PeriodSummary, Transaction } from '../../types/api.types';
import type { DashboardData, RecentTransaction } from '../../types/dashboard.types';
import { buildCategoryBreakdown } from '../../utils/build-category-breakdown';
import { formatMonthLabel } from '../../utils/format-month-label';
import { formatTransactionDate } from '../../utils/format-transaction-date';
import { getMonthRange } from '../../utils/get-month-range';
import { pickMascotState } from '../../utils/pick-mascot-state';
import { sumBalancesByCurrency } from '../../utils/sum-balances-by-currency';

const RECENT_TRANSACTION_LIMIT = 8;

type Client = { get<T>(path: string): Promise<T> };

type Input = { client: Client; baseCurrency: string; now: Date };

function toRecentTransaction(
	transaction: Transaction,
	accountsById: Map<string, Account>,
	categoriesById: Map<string, Category>,
	now: Date
): RecentTransaction {
	const account = accountsById.get(transaction.accountId);
	return {
		id: transaction.id,
		type: transaction.type,
		amount: transaction.amount,
		currency: account?.currency ?? 'IDR',
		accountName: account?.name ?? '-',
		categoryName: transaction.categoryId ? (categoriesById.get(transaction.categoryId)?.name ?? null) : null,
		note: transaction.note,
		dateLabel: formatTransactionDate(new Date(transaction.occurredAt), now)
	};
}

export async function loadDashboard({ client, baseCurrency, now }: Input): Promise<DashboardData> {
	const { from, to } = getMonthRange(now);
	const summaryQuery = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

	const [accounts, categories, summary, transactions] = await Promise.all([
		client.get<Account[]>('/accounts'),
		client.get<Category[]>('/categories'),
		client.get<PeriodSummary>(`/reports/summary?${summaryQuery}`),
		client.get<Transaction[]>(`/transactions?limit=${RECENT_TRANSACTION_LIMIT}`)
	]);

	const accountsById = new Map(accounts.map((account) => [account.id, account]));
	const categoriesById = new Map(categories.map((category) => [category.id, category]));
	const monthTotals = summary.totals.find((totals) => totals.currency === baseCurrency) ?? {
		currency: baseCurrency,
		income: 0,
		expense: 0,
		net: 0
	};

	return {
		monthLabel: formatMonthLabel(now),
		baseCurrency,
		balances: sumBalancesByCurrency(accounts),
		monthTotals,
		otherCurrencyTotals: summary.totals.filter((totals) => totals.currency !== baseCurrency),
		breakdown: buildCategoryBreakdown(summary.byCategory, categories, baseCurrency),
		accounts: accounts.filter((account) => !account.isArchived),
		recentTransactions: transactions.map((transaction) =>
			toRecentTransaction(transaction, accountsById, categoriesById, now)
		),
		mascot: pickMascotState(monthTotals)
	};
}
