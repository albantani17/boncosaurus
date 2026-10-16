import { describe, expect, test } from 'bun:test';
import type { DebtPosition } from './calculate-debt-position';
import { selectDueReminders } from './select-due-reminders';

const today = '2026-10-16';
const due = (nextDueDate: string | null, nextDueAmount: number | null = 105_000): DebtPosition => ({
  totalDue: 315_000,
  paid: 0,
  remaining: 315_000,
  principalRemaining: 300_000,
  nextDueDate,
  nextDueAmount,
  isOverdue: nextDueDate !== null && nextDueDate < today
});
const debt = (id: string, position: DebtPosition, overrides: Partial<{ reminderDays: number; status: 'active' | 'settled' }> = {}) => ({
  id,
  title: `Debt ${id}`,
  counterpartyName: 'Kredivo',
  direction: 'payable' as const,
  currency: 'IDR',
  status: 'active' as const,
  reminderDays: 3,
  position,
  ...overrides
});

describe('selectDueReminders', () => {
  test('includes debts due within their reminder window, soonest first', () => {
    const reminders = selectDueReminders([debt('b', due('2026-10-19')), debt('a', due('2026-10-16'))], today);
    expect(reminders).toEqual([
      {
        debtId: 'a',
        title: 'Debt a',
        counterpartyName: 'Kredivo',
        direction: 'payable',
        currency: 'IDR',
        amount: 105_000,
        dueDate: '2026-10-16',
        daysUntil: 0
      },
      expect.objectContaining({ debtId: 'b', daysUntil: 3 })
    ]);
  });

  test('keeps overdue debts with a negative day count', () => {
    expect(selectDueReminders([debt('a', due('2026-10-10'), { reminderDays: 0 })], today)[0]?.daysUntil).toBe(-6);
  });

  test('skips debts due after their window', () => {
    expect(selectDueReminders([debt('a', due('2026-10-17'), { reminderDays: 0 })], today)).toEqual([]);
  });

  test('skips closed debts and debts without a due date or amount', () => {
    const debts = [
      debt('a', due('2026-10-16'), { status: 'settled' }),
      debt('b', due(null)),
      debt('c', due('2026-10-16', 0))
    ];
    expect(selectDueReminders(debts, today)).toEqual([]);
  });

  test('orders reminders on the same day by title', () => {
    const reminders = selectDueReminders([debt('b', due(today)), debt('a', due(today))], today);
    expect(reminders.map((reminder) => reminder.debtId)).toEqual(['a', 'b']);
  });
});
