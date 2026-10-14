import type { Account, CurrencyTotals, MascotState, TransactionType } from './api.types';
import type { BreakdownItem } from '../utils/build-category-breakdown';
import type { CurrencyBalance } from '../utils/sum-balances-by-currency';

export type RecentTransaction = {
	id: string;
	type: TransactionType;
	amount: number;
	currency: string;
	accountName: string;
	categoryName: string | null;
	note: string | null;
	dateLabel: string;
};

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
