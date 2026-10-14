import type { Account } from '../types/api.types';

export const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
	cash: 'Tunai',
	bank: 'Bank',
	ewallet: 'E-wallet',
	credit_card: 'Kartu kredit',
	investment: 'Investasi',
	other: 'Lainnya'
};
