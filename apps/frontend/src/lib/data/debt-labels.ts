import type { DebtDirection, DebtSourceType, DebtStatus, InstallmentStatus } from '../types/api.types';

export const DEBT_DIRECTION_LABELS: Record<DebtDirection, string> = {
	payable: 'Hutang',
	receivable: 'Piutang'
};

export const DEBT_SOURCE_LABELS: Record<DebtSourceType, string> = {
	personal: 'Perorangan',
	paylater: 'Paylater',
	installment: 'Cicilan / leasing',
	credit_card: 'Kartu kredit',
	online_loan: 'Pinjol',
	bank_loan: 'Pinjaman bank (KTA)',
	other: 'Lainnya'
};

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
	active: 'Berjalan',
	settled: 'Lunas',
	written_off: 'Diikhlaskan'
};

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
	paid: 'Lunas',
	partial: 'Sebagian',
	due: 'Belum bayar',
	overdue: 'Telat'
};
