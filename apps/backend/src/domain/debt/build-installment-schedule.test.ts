import { describe, expect, test } from 'bun:test';
import { buildInstallmentSchedule, MAX_INSTALLMENTS } from './build-installment-schedule';

describe('buildInstallmentSchedule', () => {
  test('creates monthly installments of the given amount', () => {
    expect(buildInstallmentSchedule({ firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }, 300_000)).toEqual([
      { sequence: 1, dueDate: '2026-11-05', amount: 105_000 },
      { sequence: 2, dueDate: '2026-12-05', amount: 105_000 },
      { sequence: 3, dueDate: '2027-01-05', amount: 105_000 }
    ]);
  });

  test('splits the principal evenly and puts the remainder on the last installment', () => {
    const amounts = buildInstallmentSchedule({ firstDueDate: '2026-11-05', count: 3 }, 100_000).map((row) => row.amount);
    expect(amounts).toEqual([33_333, 33_333, 33_334]);
  });

  test('keeps month-end due dates inside shorter months', () => {
    const dates = buildInstallmentSchedule({ firstDueDate: '2026-01-31', count: 2, installmentAmount: 10 }, 20).map((row) => row.dueDate);
    expect(dates).toEqual(['2026-01-31', '2026-02-28']);
  });

  test('accepts a single installment', () => {
    expect(buildInstallmentSchedule({ firstDueDate: '2026-11-05', count: 1 }, 500)).toHaveLength(1);
  });

  test.each([0, -1, 1.5, MAX_INSTALLMENTS + 1])('rejects a count of %p', (count) => {
    expect(() => buildInstallmentSchedule({ firstDueDate: '2026-11-05', count }, 100)).toThrow(
      expect.objectContaining({ code: 'INVALID_SCHEDULE' })
    );
  });

  test('rejects installments that add up to less than the principal', () => {
    expect(() => buildInstallmentSchedule({ firstDueDate: '2026-11-05', count: 3, installmentAmount: 90 }, 300)).toThrow(
      expect.objectContaining({ code: 'INVALID_SCHEDULE' })
    );
  });

  test('rejects an even split that would leave an installment empty', () => {
    expect(() => buildInstallmentSchedule({ firstDueDate: '2026-11-05', count: 3 }, 2)).toThrow(
      expect.objectContaining({ code: 'INVALID_SCHEDULE' })
    );
  });
});
