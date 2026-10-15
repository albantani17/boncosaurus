import { describe, expect, test } from 'bun:test';
import { addFeesToCategoryTotals, addFeesToTotals } from './add-transfer-fees';

describe('addFeesToTotals', () => {
  test('adds each fee as an expense row of its currency', () => {
    expect(addFeesToTotals([{ currency: 'IDR', type: 'income', total: 10 }], [{ currency: 'IDR', total: 2500 }])).toEqual([
      { currency: 'IDR', type: 'income', total: 10 },
      { currency: 'IDR', type: 'expense', total: 2500 }
    ]);
  });

  test('returns the rows unchanged when there are no fees', () => {
    const rows = [{ currency: 'IDR', type: 'expense' as const, total: 5 }];
    expect(addFeesToTotals(rows, [])).toEqual(rows);
  });
});

describe('addFeesToCategoryTotals', () => {
  test('adds to the existing uncategorized expense of the same currency', () => {
    const rows = [{ categoryId: null, type: 'expense' as const, currency: 'IDR', total: 1000 }];
    expect(addFeesToCategoryTotals(rows, [{ currency: 'IDR', total: 2500 }])).toEqual([
      { categoryId: null, type: 'expense', currency: 'IDR', total: 3500 }
    ]);
  });

  test('creates an uncategorized bucket when none exists and keeps other rows', () => {
    const rows = [{ categoryId: 'cat', type: 'expense' as const, currency: 'IDR', total: 1000 }];
    expect(addFeesToCategoryTotals(rows, [{ currency: 'USD', total: 2 }])).toEqual([
      { categoryId: 'cat', type: 'expense', currency: 'IDR', total: 1000 },
      { categoryId: null, type: 'expense', currency: 'USD', total: 2 }
    ]);
  });

  test('does not mutate the input rows', () => {
    const rows = [{ categoryId: null, type: 'expense' as const, currency: 'IDR', total: 1 }];
    addFeesToCategoryTotals(rows, [{ currency: 'IDR', total: 1 }]);
    expect(rows[0]!.total).toBe(1);
  });
});
