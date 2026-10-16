import type { TransactionType } from './api.types';

export type TransactionRowData = {
	id: string;
	type: TransactionType;
	amount: number;
	toAmount: number | null;
	fee: number | null;
	currency: string;
	toCurrency: string | null;
	accountId: string;
	toAccountId: string | null;
	categoryId: string | null;
	accountName: string;
	toAccountName: string | null;
	categoryName: string | null;
	note: string | null;
	occurredAt: string;
	/** Set when the row moves loan money or is a debt charge; it is then managed from the debt. */
	debtId: string | null;
};
