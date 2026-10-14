import type { Account } from '../types/api.types';

export type CurrencyBalance = { currency: string; balance: number };

export function sumBalancesByCurrency(accounts: Account[]): CurrencyBalance[] {
	const balances = new Map<string, number>();
	for (const account of accounts) {
		if (account.isArchived) continue;
		balances.set(account.currency, (balances.get(account.currency) ?? 0) + account.balance);
	}
	return [...balances].map(([currency, balance]) => ({ currency, balance }));
}
