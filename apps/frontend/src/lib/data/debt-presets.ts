import type { DebtDirection, DebtSourceType } from '../types/api.types';

/** How the money moved: through an account (cash) or not at all yet (purchase). */
export type DebtMoneyFlow = 'cash' | 'purchase';

export type DebtPreset = {
	key: string;
	label: string;
	direction: DebtDirection;
	sourceType: DebtSourceType;
	moneyFlow: DebtMoneyFlow;
	withSchedule: boolean;
	/** Days before the due date to remind; matches the backend default for the source. */
	reminderDays: number;
};

export const DEBT_PRESETS: DebtPreset[] = [
	{ key: 'lend', label: 'Meminjamkan ke orang', direction: 'receivable', sourceType: 'personal', moneyFlow: 'cash', withSchedule: false, reminderDays: 0 },
	{ key: 'borrow', label: 'Pinjam dari orang', direction: 'payable', sourceType: 'personal', moneyFlow: 'cash', withSchedule: false, reminderDays: 0 },
	{ key: 'paid-for-me', label: 'Dibayarin teman', direction: 'payable', sourceType: 'personal', moneyFlow: 'purchase', withSchedule: false, reminderDays: 0 },
	{ key: 'paylater', label: 'Paylater', direction: 'payable', sourceType: 'paylater', moneyFlow: 'purchase', withSchedule: true, reminderDays: 3 },
	{ key: 'installment', label: 'Cicilan barang / leasing', direction: 'payable', sourceType: 'installment', moneyFlow: 'purchase', withSchedule: true, reminderDays: 3 },
	{ key: 'credit-card', label: 'Kartu kredit', direction: 'payable', sourceType: 'credit_card', moneyFlow: 'purchase', withSchedule: false, reminderDays: 3 },
	{ key: 'online-loan', label: 'Pinjol', direction: 'payable', sourceType: 'online_loan', moneyFlow: 'cash', withSchedule: true, reminderDays: 3 },
	{ key: 'bank-loan', label: 'Pinjaman bank (KTA)', direction: 'payable', sourceType: 'bank_loan', moneyFlow: 'cash', withSchedule: true, reminderDays: 3 }
];
