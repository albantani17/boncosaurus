export type TransactionType = 'income' | 'expense' | 'transfer';

export type PublicUser = { id: string; email: string; name: string };

export type WorkspaceMembership = {
	id: string;
	name: string;
	baseCurrency: string;
	role: 'owner' | 'admin' | 'member';
};

export type Profile = { user: PublicUser; workspaces: WorkspaceMembership[] };

export type Account = {
	id: string;
	name: string;
	type: 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment' | 'other';
	currency: string;
	isArchived: boolean;
	balance: number;
};

export type Category = { id: string; name: string; type: 'income' | 'expense'; isArchived: boolean };

export type Transaction = {
	id: string;
	type: TransactionType;
	accountId: string;
	toAccountId: string | null;
	categoryId: string | null;
	amount: number;
	occurredAt: string;
	note: string | null;
};

export type CurrencyTotals = { currency: string; income: number; expense: number; net: number };

export type CategoryTotal = {
	categoryId: string | null;
	type: TransactionType;
	currency: string;
	total: number;
};

export type PeriodSummary = { from: string; to: string; totals: CurrencyTotals[]; byCategory: CategoryTotal[] };

export type MascotState = 'idle' | 'happy' | 'warning';
