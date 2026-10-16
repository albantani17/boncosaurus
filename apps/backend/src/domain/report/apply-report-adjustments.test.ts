import { describe, expect, test } from 'bun:test';
import { addAdjustmentsToCategoryTotals, addAdjustmentsToTotals } from './apply-report-adjustments';

const food = { categoryId: 'food', type: 'expense' as const, currency: 'IDR', total: 100_000 };

describe('addAdjustmentsToTotals', () => {
  test('appends each adjustment as a totals row', () => {
    expect(addAdjustmentsToTotals([{ currency: 'IDR', type: 'expense', total: 100_000 }], [{ ...food, total: -60_000 }])).toEqual([
      { currency: 'IDR', type: 'expense', total: 100_000 },
      { currency: 'IDR', type: 'expense', total: -60_000 }
    ]);
  });
});

describe('addAdjustmentsToCategoryTotals', () => {
  test('adds a signed adjustment to the matching bucket', () => {
    expect(addAdjustmentsToCategoryTotals([food], [{ ...food, total: -60_000 }])).toEqual([{ ...food, total: 40_000 }]);
  });

  test('creates a bucket for an adjustment without a match', () => {
    const shopping = { ...food, categoryId: 'shop', total: 300_000 };
    expect(addAdjustmentsToCategoryTotals([food], [shopping])).toEqual([food, shopping]);
  });

  test('keeps buckets apart by type and currency', () => {
    const income = { ...food, type: 'income' as const, total: 5 };
    const usd = { ...food, currency: 'USD', total: 5 };
    expect(addAdjustmentsToCategoryTotals([food], [income, usd])).toEqual([food, income, usd]);
  });

  test('drops a bucket that the adjustments bring to zero', () => {
    expect(addAdjustmentsToCategoryTotals([food], [{ ...food, total: -100_000 }])).toEqual([]);
  });

  test('does not mutate the input rows', () => {
    const rows = [{ ...food }];
    addAdjustmentsToCategoryTotals(rows, [{ ...food, total: -1 }]);
    expect(rows[0]!.total).toBe(100_000);
  });
});
