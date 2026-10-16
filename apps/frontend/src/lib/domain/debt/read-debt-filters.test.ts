import { describe, expect, test } from 'bun:test';
import { readDebtFilters, toDebtFilterHref } from './read-debt-filters';

describe('readDebtFilters', () => {
	test('defaults to active payables', () => {
		expect(readDebtFilters(new URLSearchParams())).toEqual({ direction: 'payable', view: 'active' });
	});

	test('reads receivables that are finished', () => {
		expect(readDebtFilters(new URLSearchParams('arah=piutang&status=selesai'))).toEqual({
			direction: 'receivable',
			view: 'closed'
		});
	});

	test('ignores unknown values', () => {
		expect(readDebtFilters(new URLSearchParams('arah=x&status=y'))).toEqual({ direction: 'payable', view: 'active' });
	});
});

describe('toDebtFilterHref', () => {
	test('builds the query of the active view', () => {
		expect(toDebtFilterHref({ direction: 'receivable', view: 'active' })).toBe('?arah=piutang');
	});

	test('adds the finished status', () => {
		expect(toDebtFilterHref({ direction: 'payable', view: 'closed' })).toBe('?arah=hutang&status=selesai');
	});
});
