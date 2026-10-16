import type { DebtDirection } from '@boncosaurus/shared';
import type { CategoryTotalRow } from '../../types/report.types';

export type DebtCategoryAmountRow = { categoryId: string | null; currency: string; total: number };
export type DebtWriteOffRow = DebtCategoryAmountRow & { direction: DebtDirection };

export type DebtReportRows = {
  /** Shares of my expenses that others owe me, dated by the expense. */
  splits: DebtCategoryAmountRow[];
  /** Purchases made on credit (paylater, a friend paid), dated when bought. */
  purchases: DebtCategoryAmountRow[];
  /** Remainders given up on, dated when written off. */
  writeOffs: DebtWriteOffRow[];
};

/** Turns debt activity into signed report rows: loan money itself never counts as income or expense. */
export function buildDebtAdjustments({ splits, purchases, writeOffs }: DebtReportRows): CategoryTotalRow[] {
  return [
    ...splits.map(({ categoryId, currency, total }): CategoryTotalRow => ({ categoryId, type: 'expense', currency, total: -total })),
    ...purchases.map(({ categoryId, currency, total }): CategoryTotalRow => ({ categoryId, type: 'expense', currency, total })),
    ...writeOffs.map(({ direction, categoryId, currency, total }): CategoryTotalRow => ({
      categoryId,
      // A forgiven receivable is money I spent after all; a forgiven payable is money I keep.
      type: direction === 'receivable' ? 'expense' : 'income',
      currency,
      total
    }))
  ];
}
