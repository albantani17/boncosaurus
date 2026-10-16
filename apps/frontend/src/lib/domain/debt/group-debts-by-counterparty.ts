import type { Debt } from '../../types/api.types';

export type CurrencyRemaining = { currency: string; remaining: number };

export type CounterpartyDebtGroup = {
	counterpartyId: string;
	name: string;
	kind: Debt['counterpartyKind'];
	remaining: CurrencyRemaining[];
	hasOverdue: boolean;
	debts: Debt[];
};

/** Groups debts per person or provider, keeping the order in which each first appears. */
export function groupDebtsByCounterparty(debts: Debt[]): CounterpartyDebtGroup[] {
	const groups = new Map<string, CounterpartyDebtGroup>();
	for (const debt of debts) {
		const group = groups.get(debt.counterpartyId) ?? {
			counterpartyId: debt.counterpartyId,
			name: debt.counterpartyName,
			kind: debt.counterpartyKind,
			remaining: [],
			hasOverdue: false,
			debts: []
		};
		group.debts.push(debt);
		group.hasOverdue ||= debt.position.isOverdue;
		const total = group.remaining.find((row) => row.currency === debt.currency);
		if (total) total.remaining += debt.position.remaining;
		else group.remaining.push({ currency: debt.currency, remaining: debt.position.remaining });
		groups.set(debt.counterpartyId, group);
	}
	return [...groups.values()];
}
