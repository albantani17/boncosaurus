import type { Account, Category, Transaction } from '../../types/api.types';
import type { TransactionRowData } from '../../types/transaction-row.types';
import { type TransactionFilterValues, toTransactionQuery } from '../../utils/transaction-filters';
import { toTransactionRow } from './to-transaction-row';

export const TRANSACTIONS_PAGE_SIZE = 50;

type Client = { get<T>(path: string): Promise<T> };

export type TransactionPage = {
	rows: TransactionRowData[];
	hasMore: boolean;
	accounts: Account[];
	categories: Category[];
};

export async function loadTransactionPage(
	client: Client,
	filters: TransactionFilterValues,
	offset: number
): Promise<TransactionPage> {
	// One extra row tells whether another page exists without a count query.
	const query = toTransactionQuery(filters, { limit: TRANSACTIONS_PAGE_SIZE + 1, offset });
	const [accounts, categories, transactions] = await Promise.all([
		client.get<Account[]>('/accounts'),
		client.get<Category[]>('/categories'),
		client.get<Transaction[]>(`/transactions?${query}`)
	]);

	const accountsById = new Map(accounts.map((account) => [account.id, account]));
	const categoriesById = new Map(categories.map((category) => [category.id, category]));
	return {
		rows: transactions
			.slice(0, TRANSACTIONS_PAGE_SIZE)
			.map((transaction) => toTransactionRow(transaction, accountsById, categoriesById)),
		hasMore: transactions.length > TRANSACTIONS_PAGE_SIZE,
		accounts,
		categories
	};
}
