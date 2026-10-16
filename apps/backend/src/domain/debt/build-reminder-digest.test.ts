import { describe, expect, test } from 'bun:test';
import { buildReminderDigest } from './build-reminder-digest';
import type { DebtReminder } from './select-due-reminders';

const reminder = (overrides: Partial<DebtReminder> = {}): DebtReminder => ({
  debtId: 'debt-1',
  title: 'Sepatu',
  counterpartyName: 'Kredivo',
  direction: 'payable',
  currency: 'IDR',
  amount: 105_000,
  dueDate: '2026-10-19',
  daysUntil: 3,
  ...overrides
});

describe('buildReminderDigest', () => {
  test('links a single reminder to its debt', () => {
    expect(buildReminderDigest([reminder()])).toEqual({
      title: '1 hutang/piutang segera jatuh tempo',
      body: 'Bayar Kredivo (Sepatu) Rp105.000, 3 hari lagi',
      url: '/hutang/debt-1'
    });
  });

  test('leads with overdue debts and lists receivables to collect', () => {
    const digest = buildReminderDigest([
      reminder({ daysUntil: -2 }),
      reminder({ debtId: 'd2', direction: 'receivable', counterpartyName: 'Hani', title: 'Makan', amount: 60_000, daysUntil: 0 }),
      reminder({ debtId: 'd3', currency: 'USD', amount: 5, daysUntil: 1 })
    ]);
    expect(digest).toEqual({
      title: '1 hutang/piutang lewat jatuh tempo',
      body: [
        'Bayar Kredivo (Sepatu) Rp105.000, telat 2 hari',
        'Tagih Hani (Makan) Rp60.000, hari ini',
        'Bayar Kredivo (Sepatu) USD 5, besok'
      ].join('\n'),
      url: '/hutang'
    });
  });

  test('summarizes reminders beyond the first three', () => {
    const digest = buildReminderDigest([1, 2, 3, 4, 5].map((n) => reminder({ debtId: `d${n}` })));
    expect(digest.body.split('\n')).toHaveLength(4);
    expect(digest.body.endsWith('+2 lainnya')).toBe(true);
  });
});
