import { describe, expect, test } from 'bun:test';
import { buildDebtAdjustments } from './build-debt-adjustments';

const none = { splits: [], purchases: [], writeOffs: [] };

describe('buildDebtAdjustments', () => {
  test('removes the shares others owe from the expense category', () => {
    expect(buildDebtAdjustments({ ...none, splits: [{ categoryId: 'food', currency: 'IDR', total: 60_000 }] })).toEqual([
      { categoryId: 'food', type: 'expense', currency: 'IDR', total: -60_000 }
    ]);
  });

  test('adds a purchase on credit to its category', () => {
    expect(buildDebtAdjustments({ ...none, purchases: [{ categoryId: 'shop', currency: 'IDR', total: 300_000 }] })).toEqual([
      { categoryId: 'shop', type: 'expense', currency: 'IDR', total: 300_000 }
    ]);
  });

  test('counts a written-off receivable as an expense and a written-off payable as income', () => {
    const writeOffs = [
      { direction: 'receivable' as const, categoryId: 'food', currency: 'IDR', total: 4_000 },
      { direction: 'payable' as const, categoryId: null, currency: 'IDR', total: 4_000 }
    ];
    expect(buildDebtAdjustments({ ...none, writeOffs })).toEqual([
      { categoryId: 'food', type: 'expense', currency: 'IDR', total: 4_000 },
      { categoryId: null, type: 'income', currency: 'IDR', total: 4_000 }
    ]);
  });

  test('returns nothing when there is no debt activity', () => {
    expect(buildDebtAdjustments(none)).toEqual([]);
  });
});
