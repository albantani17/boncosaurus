import type { TransactionType } from '../constants/transaction-types';

export type CurrencyTotals = { currency: string; income: number; expense: number; net: number };

export type CategoryTotal = {
  categoryId: string | null;
  type: TransactionType;
  currency: string;
  total: number;
};

export type PeriodSummaryDto = {
  from: string;
  to: string;
  totals: CurrencyTotals[];
  byCategory: CategoryTotal[];
};
