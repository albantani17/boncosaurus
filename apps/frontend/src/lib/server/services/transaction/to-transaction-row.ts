import type { Account, Category, Transaction } from '../../../types/api.types';
import type { TransactionRowData } from '../../../types/transaction-row.types';

const UNKNOWN_ACCOUNT = '-';

export function toTransactionRow(
	transaction: Transaction,
	accountsById: Map<string, Account>,
	categoriesById: Map<string, Category>
): TransactionRowData {
	const account = accountsById.get(transaction.accountId);
	const toAccount = transaction.toAccountId ? accountsById.get(transaction.toAccountId) : undefined;
	const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
	return {
		id: transaction.id,
		type: transaction.type,
		amount: transaction.amount,
		toAmount: transaction.toAmount,
		fee: transaction.fee,
		currency: account?.currency ?? 'IDR',
		toCurrency: toAccount?.currency ?? null,
		accountId: transaction.accountId,
		toAccountId: transaction.toAccountId,
		categoryId: transaction.categoryId,
		accountName: account?.name ?? UNKNOWN_ACCOUNT,
		toAccountName: transaction.toAccountId ? (toAccount?.name ?? UNKNOWN_ACCOUNT) : null,
		categoryName: category?.name ?? null,
		note: transaction.note,
		occurredAt: transaction.occurredAt
	};
}
