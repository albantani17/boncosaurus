import type { Account, Category } from '../types/api.types';
import type { TransactionProposalDraft } from '../types/ai.types';
import { formatCurrency } from './format-currency';

export type ProposalSummary = {
	amount: string;
	toAmount: string | null;
	account: string;
	toAccount: string | null;
	category: string | null;
	date: string;
};

const UNKNOWN = 'Tidak ditemukan';

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export function describeTransactionProposal(
	draft: TransactionProposalDraft,
	accounts: Pick<Account, 'id' | 'name' | 'currency'>[],
	categories: Pick<Category, 'id' | 'name' | 'parentId'>[]
): ProposalSummary {
	const account = accounts.find((row) => row.id === draft.accountId);
	const toAccount = draft.toAccountId ? accounts.find((row) => row.id === draft.toAccountId) : undefined;
	const category = draft.categoryId ? categories.find((row) => row.id === draft.categoryId) : undefined;
	const parent = category?.parentId ? categories.find((row) => row.id === category.parentId) : undefined;
	const currency = account?.currency;

	return {
		amount: formatCurrency(draft.amount, currency),
		toAmount: draft.toAmount === null ? null : formatCurrency(draft.toAmount, toAccount?.currency),
		account: account?.name ?? UNKNOWN,
		toAccount: draft.toAccountId ? (toAccount?.name ?? UNKNOWN) : null,
		category: draft.categoryId ? (category ? [parent?.name, category.name].filter(Boolean).join(' › ') : UNKNOWN) : null,
		date: dateFormat.format(new Date(draft.occurredAt))
	};
}
