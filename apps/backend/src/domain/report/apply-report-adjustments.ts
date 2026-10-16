import type { CategoryTotalRow, TotalsRow } from '../../types/report.types';

export function addAdjustmentsToTotals(rows: TotalsRow[], adjustments: CategoryTotalRow[]): TotalsRow[] {
  return [...rows, ...adjustments.map(({ currency, type, total }): TotalsRow => ({ currency, type, total }))];
}

/** Merges signed adjustments into category totals and drops buckets that end up at zero. */
export function addAdjustmentsToCategoryTotals(rows: CategoryTotalRow[], adjustments: CategoryTotalRow[]): CategoryTotalRow[] {
  const result = rows.map((row) => ({ ...row }));
  for (const adjustment of adjustments) {
    const bucket = result.find(
      (row) => row.categoryId === adjustment.categoryId && row.type === adjustment.type && row.currency === adjustment.currency
    );
    if (bucket) bucket.total += adjustment.total;
    else result.push({ ...adjustment });
  }
  return result.filter((row) => row.total !== 0);
}
