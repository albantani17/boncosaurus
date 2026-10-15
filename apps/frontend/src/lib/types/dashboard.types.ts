import type { Account, CurrencyTotals, MascotState } from './api.types';
import type { TransactionRowData } from './transaction-row.types';
import type { BreakdownItem } from '../domain/category/build-category-breakdown';
import type { CurrencyBalance } from '../domain/account/sum-balances-by-currency';

export type RecentTransaction = TransactionRowData & { dateLabel: string };

export type DashboardData = {
	monthLabel: string;
	baseCurrency: string;
	balances: CurrencyBalance[];
	monthTotals: CurrencyTotals;
	otherCurrencyTotals: CurrencyTotals[];
	breakdown: BreakdownItem[];
	accounts: Account[];
	recentTransactions: RecentTransaction[];
	mascot: MascotState;
};
