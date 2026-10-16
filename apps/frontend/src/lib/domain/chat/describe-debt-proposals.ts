import { DEBT_DIRECTION_LABELS, DEBT_SOURCE_LABELS } from '../../data/debt-labels';
import type {
	DebtPaymentProposalDraft,
	DebtProposalDraft,
	DebtWriteOffProposalDraft
} from '../../types/ai.types';
import type { Account, Category } from '../../types/api.types';
import { formatCalendarDate } from '../../utils/format-calendar-date';
import { formatCurrency } from '../../utils/format-currency';

export type DraftRow = { label: string; value: string };
export type DebtDraftSummary = {
	kicker: string;
	amount: string;
	tone: 'income' | 'expense';
	rows: DraftRow[];
	savedHref: string;
};

const UNKNOWN = 'Tidak ditemukan';
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const nameOf = (rows: { id: string; name: string }[], id: string | null | undefined) =>
	rows.find((row) => row.id === id)?.name ?? UNKNOWN;

// Money owed to the user is shown like income, money the user owes like an expense.
const toneOf = (direction: DebtProposalDraft['direction']) => (direction === 'receivable' ? 'income' : 'expense');

const present = (rows: (DraftRow | null | false | '' | undefined)[]) => rows.filter((row): row is DraftRow => Boolean(row));

export function describeDebtProposal(
	draft: DebtProposalDraft,
	accounts: Pick<Account, 'id' | 'name' | 'currency'>[],
	categories: Pick<Category, 'id' | 'name'>[]
): DebtDraftSummary {
	const currency = draft.origin === 'cash' ? accounts.find((row) => row.id === draft.accountId)?.currency : draft.currency;
	const money = (amount: number) => formatCurrency(amount, currency ?? undefined);
	const { schedule } = draft;
	const isPayable = draft.direction === 'payable';

	return {
		kicker: `Draf ${DEBT_DIRECTION_LABELS[draft.direction].toLowerCase()}`,
		amount: money(draft.principal),
		tone: toneOf(draft.direction),
		rows: present([
			{ label: isPayable ? 'Ke' : 'Dari', value: draft.counterpartyName ?? UNKNOWN },
			{ label: 'Untuk', value: draft.title },
			{ label: 'Sumber', value: DEBT_SOURCE_LABELS[draft.sourceType] },
			draft.origin === 'cash'
				? { label: isPayable ? 'Masuk ke' : 'Keluar dari', value: nameOf(accounts, draft.accountId) }
				: { label: 'Kategori', value: `${nameOf(categories, draft.categoryId)} · belum ada uang keluar` },
			schedule && {
				label: 'Cicilan',
				value: schedule.installmentAmount
					? `${schedule.count}× ${money(schedule.installmentAmount)} mulai ${formatCalendarDate(schedule.firstDueDate)}`
					: `${schedule.count}× dibagi rata mulai ${formatCalendarDate(schedule.firstDueDate)}`
			},
			!schedule && draft.dueDate && { label: 'Jatuh tempo', value: formatCalendarDate(draft.dueDate) },
			draft.reminderDays != null && {
				label: 'Pengingat',
				value: draft.reminderDays === 0 ? 'Pada hari jatuh tempo' : `${draft.reminderDays} hari sebelumnya`
			},
			{ label: 'Tanggal', value: dateFormat.format(new Date(draft.originatedAt)) },
			draft.note && { label: 'Catatan', value: draft.note }
		]),
		savedHref: '/hutang'
	};
}

export function describeDebtPaymentProposal(
	draft: DebtPaymentProposalDraft,
	accounts: Pick<Account, 'id' | 'name'>[],
	categories: Pick<Category, 'id' | 'name'>[]
): DebtDraftSummary {
	const money = (amount: number) => formatCurrency(amount, draft.currency);
	const isPayable = draft.direction === 'payable';
	return {
		kicker: isPayable ? 'Draf bayar hutang' : 'Draf terima pembayaran',
		amount: money(draft.amount),
		tone: toneOf(draft.direction),
		rows: present([
			{ label: isPayable ? 'Ke' : 'Dari', value: `${draft.counterpartyName} · ${draft.debtTitle}` },
			{ label: isPayable ? 'Dari akun' : 'Ke akun', value: nameOf(accounts, draft.accountId) },
			draft.extraAmount > 0 && {
				label: 'Rincian',
				value: `${money(draft.principalAmount)} pokok + ${money(draft.extraAmount)} ${isPayable ? 'bunga/biaya' : 'lebih bayar'}`
			},
			draft.extraAmount > 0 && {
				label: 'Kategori lebih',
				value: draft.extraCategoryId ? nameOf(categories, draft.extraCategoryId) : 'Tanpa kategori'
			},
			{ label: 'Waktu', value: dateFormat.format(new Date(draft.paidAt)) },
			draft.note && { label: 'Catatan', value: draft.note }
		]),
		savedHref: `/hutang/${draft.debtId}`
	};
}

export function describeDebtWriteOffProposal(draft: DebtWriteOffProposalDraft): DebtDraftSummary {
	const isPayable = draft.direction === 'payable';
	return {
		kicker: 'Draf ikhlaskan sisa',
		amount: formatCurrency(draft.amount, draft.currency),
		tone: toneOf(draft.direction),
		rows: [
			{ label: isPayable ? 'Hutang ke' : 'Piutang dari', value: `${draft.counterpartyName} · ${draft.debtTitle}` },
			{
				label: 'Dampak',
				value: isPayable ? 'Sisa pokok dicatat sebagai pemasukan hari ini' : 'Sisa pokok dicatat sebagai pengeluaran hari ini'
			}
		],
		savedHref: `/hutang/${draft.debtId}`
	};
}
