import type { TransactionType } from './api.types';

export type TransactionRowData = {
	id: string;
	type: TransactionType;
	amount: number;
	toAmount: number | null;
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
};
