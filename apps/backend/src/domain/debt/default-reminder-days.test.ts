import { describe, expect, test } from 'bun:test';
import { defaultReminderDays } from './default-reminder-days';

describe('defaultReminderDays', () => {
  test('reminds about a personal debt on its due date', () => {
    expect(defaultReminderDays('personal')).toBe(0);
  });

  test.each(['paylater', 'installment', 'credit_card', 'online_loan', 'bank_loan', 'other'] as const)(
    'reminds about %s three days ahead',
    (sourceType) => expect(defaultReminderDays(sourceType)).toBe(3)
  );
});
