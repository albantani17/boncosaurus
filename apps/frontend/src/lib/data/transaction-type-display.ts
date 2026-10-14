import ArrowDownLeft from '@lucide/svelte/icons/arrow-down-left';
import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
import type { TransactionType } from '../types/api.types';

export const TRANSACTION_TYPE_DISPLAY = {
	income: { label: 'Pemasukan', sign: '+', icon: ArrowDownLeft, textClass: 'text-dino-400' },
	expense: { label: 'Pengeluaran', sign: '−', icon: ArrowUpRight, textClass: 'text-coral-400' },
	transfer: { label: 'Transfer', sign: '', icon: ArrowLeftRight, textClass: 'text-sage-300' }
} satisfies Record<TransactionType, object>;
