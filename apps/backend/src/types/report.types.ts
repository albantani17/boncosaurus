import type { CurrencyTotals } from '@boncosaurus/shared';
import type { Transaction } from './finance.types';

export type DateRange = { from: Date; to: Date };

export type TotalsRow = { currency: string; type: Transaction['type']; total: number };

export type CategoryTotalRow = {
  categoryId: string | null;
  type: Transaction['type'];
  currency: string;
  total: number;
};

export type { CurrencyTotals } from '@boncosaurus/shared';

export type PeriodSummary = {
  from: Date;
  to: Date;
  totals: CurrencyTotals[];
  byCategory: CategoryTotalRow[];
};
