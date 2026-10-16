import { describe, expect, test } from 'bun:test';
import { addMonthsToDate } from './add-months-to-date';

describe('addMonthsToDate', () => {
  test('adds months within the same year', () => {
    expect(addMonthsToDate('2026-01-15', 2)).toBe('2026-03-15');
  });

  test('rolls over into the next year', () => {
    expect(addMonthsToDate('2026-11-05', 3)).toBe('2027-02-05');
  });

  test('clamps the day to the end of a shorter month', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2028-01-31', 1)).toBe('2028-02-29');
  });

  test('returns the same date when adding zero months', () => {
    expect(addMonthsToDate('2026-10-16', 0)).toBe('2026-10-16');
  });

  test('throws on a value that is not YYYY-MM-DD', () => {
    expect(() => addMonthsToDate('16/10/2026', 1)).toThrow(RangeError);
  });
});
