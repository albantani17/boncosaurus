import type { DebtDirection } from '../../types/api.types';

export type DebtView = 'active' | 'closed';
export type DebtFilterValues = { direction: DebtDirection; view: DebtView };

const DIRECTION_PARAMS: Record<string, DebtDirection> = { hutang: 'payable', piutang: 'receivable' };

export const DIRECTION_PARAM: Record<DebtDirection, string> = { payable: 'hutang', receivable: 'piutang' };

/** Reads `?arah=hutang|piutang&status=selesai`; defaults to active payables. */
export function readDebtFilters(params: URLSearchParams): DebtFilterValues {
	return {
		direction: DIRECTION_PARAMS[params.get('arah') ?? ''] ?? 'payable',
		view: params.get('status') === 'selesai' ? 'closed' : 'active'
	};
}

export function toDebtFilterHref(filters: DebtFilterValues): string {
	const query = new URLSearchParams({ arah: DIRECTION_PARAM[filters.direction] });
	if (filters.view === 'closed') query.set('status', 'selesai');
	return `?${query}`;
}
