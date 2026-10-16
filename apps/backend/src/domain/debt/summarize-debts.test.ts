import { describe, expect, test } from 'bun:test';
import type { DebtPosition } from './calculate-debt-position';
import { summarizeDebts } from './summarize-debts';

const position = (remaining: number, isOverdue = false): DebtPosition => ({
  totalDue: remaining,
  paid: 0,
  remaining,
  principalRemaining: remaining,
  nextDueDate: null,
  nextDueAmount: null,
  isOverdue
});

describe('summarizeDebts', () => {
  test('totals what remains per direction and currency', () => {
    const summary = summarizeDebts([
      { direction: 'receivable', currency: 'IDR', status: 'active', position: position(4_500) },
      { direction: 'receivable', currency: 'IDR', status: 'active', position: position(30_000, true) },
      { direction: 'payable', currency: 'IDR', status: 'active', position: position(210_000) },
      { direction: 'payable', currency: 'USD', status: 'active', position: position(10) }
    ]);

    expect(summary).toEqual({
      totals: [
        { currency: 'IDR', payable: 210_000, receivable: 34_500 },
        { currency: 'USD', payable: 10, receivable: 0 }
      ],
      activeCount: 4,
      overdueCount: 1
    });
  });

  test('ignores settled and written-off debts', () => {
    const summary = summarizeDebts([
      { direction: 'receivable', currency: 'IDR', status: 'settled', position: position(0) },
      { direction: 'payable', currency: 'IDR', status: 'written_off', position: position(0, true) }
    ]);
    expect(summary).toEqual({ totals: [], activeCount: 0, overdueCount: 0 });
  });
});
