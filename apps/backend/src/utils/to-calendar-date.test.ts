import { describe, expect, test } from 'bun:test';
import { toCalendarDate } from './to-calendar-date';

describe('toCalendarDate', () => {
  test('formats the local calendar day with zero padding', () => {
    expect(toCalendarDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
