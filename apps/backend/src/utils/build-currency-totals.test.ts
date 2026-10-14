import { describe, expect, test } from 'bun:test';
import { buildCurrencyTotals } from './build-currency-totals';

describe('buildCurrencyTotals', () => {
  test('pivots income and expense rows of one currency into a single entry', () => {
    const totals = buildCurrencyTotals([
      { currency: 'IDR', type: 'income', total: 5000 },
      { currency: 'IDR', type: 'expense', total: 2000 }
    ]);

    expect(totals).toEqual([{ currency: 'IDR', income: 5000, expense: 2000, net: 3000 }]);
  });

  test('returns an empty list when there are no rows', () => {
    expect(buildCurrencyTotals([])).toEqual([]);
  });

  test('keeps currencies separate and sorted by code', () => {
    const totals = buildCurrencyTotals([
      { currency: 'USD', type: 'expense', total: 10 },
      { currency: 'IDR', type: 'income', total: 100 }
    ]);

    expect(totals).toEqual([
      { currency: 'IDR', income: 100, expense: 0, net: 100 },
      { currency: 'USD', income: 0, expense: 10, net: -10 }
    ]);
  });

  test('ignores transfer rows', () => {
    const totals = buildCurrencyTotals([
      { currency: 'IDR', type: 'transfer', total: 999 },
      { currency: 'IDR', type: 'expense', total: 1 }
    ]);

    expect(totals).toEqual([{ currency: 'IDR', income: 0, expense: 1, net: -1 }]);
  });
});
