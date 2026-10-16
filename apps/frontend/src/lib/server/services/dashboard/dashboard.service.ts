import type { Account, Category, DebtSummary, PeriodSummary, Transaction } from '../../../types/api.types';
import type { DashboardData } from '../../../types/dashboard.types';
import { buildCategoryBreakdown } from '../../../domain/category/build-category-breakdown';
import { formatMonthLabel } from '../../../utils/format-month-label';
import { formatTransactionDate } from '../../../domain/transaction/format-transaction-date';
import { getMonthRange } from '../../../utils/get-month-range';
import { pickMascotState } from '../../../domain/mascot/pick-mascot-state';
import { sumBalancesByCurrency } from '../../../domain/account/sum-balances-by-currency';
import { toTransactionRow } from '../transaction/to-transaction-row';

const RECENT_TRANSACTION_LIMIT = 8;

type Client = { get<T>(path: string): Promise<T> };

type Input = { client: Client; baseCurrency: string; now: Date };

export async function loadDashboard({ client, baseCurrency, now }: Input): Promise<DashboardData> {
	const { from, to } = getMonthRange(now);
	const summaryQuery = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

	const [accounts, categories, summary, transactions, debtSummary] = await Promise.all([
		client.get<Account[]>('/accounts'),
		client.get<Category[]>('/categories'),
		client.get<PeriodSummary>(`/reports/summary?${summaryQuery}`),
		client.get<Transaction[]>(`/transactions?limit=${RECENT_TRANSACTION_LIMIT}`),
		client.get<DebtSummary>('/debts/summary')
	]);

	const accountsById = new Map(accounts.map((account) => [account.id, account]));
	const categoriesById = new Map(categories.map((category) => [category.id, category]));
	const monthTotals = summary.totals.find((totals) => totals.currency === baseCurrency) ?? {
		currency: baseCurrency,
		income: 0,
		expense: 0,
		net: 0
	};

	const baseDebtTotals = debtSummary.totals.find((totals) => totals.currency === baseCurrency);

	return {
		monthLabel: formatMonthLabel(now),
		baseCurrency,
		balances: sumBalancesByCurrency(accounts),
		monthTotals,
		otherCurrencyTotals: summary.totals.filter((totals) => totals.currency !== baseCurrency),
		breakdown: buildCategoryBreakdown(summary.byCategory, categories, baseCurrency),
		accounts: accounts.filter((account) => !account.isArchived),
		recentTransactions: transactions.map((transaction) => ({
			...toTransactionRow(transaction, accountsById, categoriesById),
			dateLabel: formatTransactionDate(new Date(transaction.occurredAt), now)
		})),
		mascot: pickMascotState(monthTotals),
		debts: {
			payable: baseDebtTotals?.payable ?? 0,
			receivable: baseDebtTotals?.receivable ?? 0,
			activeCount: debtSummary.activeCount,
			overdueCount: debtSummary.overdueCount
		}
	};
}
