import { describe, expect, test } from 'bun:test';
import { daysBetweenDates } from './days-between-dates';

describe('daysBetweenDates', () => {
  test('counts the days forward across a month', () => {
    expect(daysBetweenDates('2026-10-30', '2026-11-02')).toBe(3);
  });

  test('is zero for the same day and negative going back', () => {
    expect(daysBetweenDates('2026-10-16', '2026-10-16')).toBe(0);
    expect(daysBetweenDates('2026-10-16', '2026-10-13')).toBe(-3);
  });
});
