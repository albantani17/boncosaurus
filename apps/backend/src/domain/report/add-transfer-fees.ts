import type { CategoryTotalRow, TotalsRow } from '../../types/report.types';

export type TransferFeeRow = { currency: string; total: number };

export function addFeesToTotals(rows: TotalsRow[], fees: TransferFeeRow[]): TotalsRow[] {
  return [...rows, ...fees.map(({ currency, total }): TotalsRow => ({ currency, type: 'expense', total }))];
}

// Fees have no category, so they join the uncategorized expense bucket of their currency.
export function addFeesToCategoryTotals(rows: CategoryTotalRow[], fees: TransferFeeRow[]): CategoryTotalRow[] {
  const result = rows.map((row) => ({ ...row }));
  for (const { currency, total } of fees) {
    const bucket = result.find((row) => row.categoryId === null && row.type === 'expense' && row.currency === currency);
    if (bucket) bucket.total += total;
    else result.push({ categoryId: null, type: 'expense', currency, total });
  }
  return result;
}
