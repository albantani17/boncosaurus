import { describe, expect, test } from 'bun:test';
import { makeDebt } from './debt-test-fixtures';
import { groupDebtsByCounterparty } from './group-debts-by-counterparty';

const withRemaining = (remaining: number, isOverdue = false) => ({
	totalDue: remaining,
	paid: 0,
	remaining,
	principalRemaining: remaining,
	nextDueDate: null,
	nextDueAmount: null,
	isOverdue
});

describe('groupDebtsByCounterparty', () => {
	test('sums what remains per person and currency', () => {
		const groups = groupDebtsByCounterparty([
			makeDebt({ id: 'a', position: withRemaining(16_000) }),
			makeDebt({ id: 'b', counterpartyId: 'cp-2', counterpartyName: 'Hani', position: withRemaining(60_000, true) }),
			makeDebt({ id: 'c', position: withRemaining(22_000) }),
			makeDebt({ id: 'd', currency: 'USD', position: withRemaining(5) })
		]);

		expect(groups.map(({ name, remaining, hasOverdue, debts }) => ({ name, remaining, hasOverdue, ids: debts.map((d) => d.id) }))).toEqual([
			{
				name: 'Sultan',
				remaining: [
					{ currency: 'IDR', remaining: 38_000 },
					{ currency: 'USD', remaining: 5 }
				],
				hasOverdue: false,
				ids: ['a', 'c', 'd']
			},
			{ name: 'Hani', remaining: [{ currency: 'IDR', remaining: 60_000 }], hasOverdue: true, ids: ['b'] }
		]);
	});

	test('returns no groups for no debts', () => {
		expect(groupDebtsByCounterparty([])).toEqual([]);
	});
});
