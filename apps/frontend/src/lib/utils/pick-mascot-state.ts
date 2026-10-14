import type { CurrencyTotals, MascotState } from '../types/api.types';

export function pickMascotState(totals: CurrencyTotals | undefined): MascotState {
	if (!totals) return 'idle';
	if (totals.expense > totals.income) return 'warning';
	if (totals.income > 0) return 'happy';
	return 'idle';
}
