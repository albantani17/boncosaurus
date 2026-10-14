import type { CurrencyTotals, TotalsRow } from '../types/report.types';

export function buildCurrencyTotals(rows: TotalsRow[]): CurrencyTotals[] {
  const totalsByCurrency = new Map<string, CurrencyTotals>();

  for (const row of rows) {
    if (row.type === 'transfer') continue;
    const totals = totalsByCurrency.get(row.currency) ?? {
      currency: row.currency,
      income: 0,
      expense: 0,
      net: 0
    };
    totals[row.type] += row.total;
    totals.net = totals.income - totals.expense;
    totalsByCurrency.set(row.currency, totals);
  }

  return [...totalsByCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}
