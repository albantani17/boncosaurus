import { describe, expect, test } from 'bun:test';
import { allocateInstallments } from './allocate-installments';

const installments = [
  { sequence: 2, dueDate: '2026-12-05', amount: 100 },
  { sequence: 1, dueDate: '2026-11-05', amount: 100 },
  { sequence: 3, dueDate: '2027-01-05', amount: 100 }
];

const statuses = (paid: number, today = '2026-10-16') =>
  allocateInstallments(installments, paid, today).map(({ sequence, paidAmount, status }) => ({ sequence, paidAmount, status }));

describe('allocateInstallments', () => {
  test('marks every installment due when nothing is paid', () => {
    expect(statuses(0)).toEqual([
      { sequence: 1, paidAmount: 0, status: 'due' },
      { sequence: 2, paidAmount: 0, status: 'due' },
      { sequence: 3, paidAmount: 0, status: 'due' }
    ]);
  });

  test('fills installments in sequence order and marks the next one partial', () => {
    expect(statuses(150)).toEqual([
      { sequence: 1, paidAmount: 100, status: 'paid' },
      { sequence: 2, paidAmount: 50, status: 'partial' },
      { sequence: 3, paidAmount: 0, status: 'due' }
    ]);
  });

  test('marks unpaid installments past their due date as overdue', () => {
    expect(statuses(50, '2026-12-10').map((row) => row.status)).toEqual(['overdue', 'overdue', 'due']);
  });

  test('ignores payments beyond the last installment', () => {
    expect(statuses(1000).every((row) => row.status === 'paid' && row.paidAmount === 100)).toBe(true);
  });

  test('returns an empty list when there is no schedule', () => {
    expect(allocateInstallments([], 100, '2026-10-16')).toEqual([]);
  });
});
