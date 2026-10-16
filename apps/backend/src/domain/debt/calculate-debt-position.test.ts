import { describe, expect, test } from 'bun:test';
import { calculateDebtPosition } from './calculate-debt-position';

const today = '2026-10-16';
const openDebt = { principal: 18_500, status: 'active' as const, dueDate: null };
const payment = (amount: number, principalAmount = amount) => ({ amount, principalAmount });
const paylaterSchedule = [
  { sequence: 1, dueDate: '2026-11-05', amount: 105_000 },
  { sequence: 2, dueDate: '2026-12-05', amount: 105_000 },
  { sequence: 3, dueDate: '2027-01-05', amount: 105_000 }
];

describe('calculateDebtPosition', () => {
  test('owes the full principal when nothing is paid', () => {
    expect(calculateDebtPosition(openDebt, [], [], today)).toEqual({
      totalDue: 18_500,
      paid: 0,
      remaining: 18_500,
      principalRemaining: 18_500,
      nextDueDate: null,
      nextDueAmount: null,
      isOverdue: false
    });
  });

  test('reduces what remains after a partial payment', () => {
    const position = calculateDebtPosition(openDebt, [], [payment(14_000)], today);
    expect(position.remaining).toBe(4_500);
    expect(position.principalRemaining).toBe(4_500);
  });

  test('never reports a negative remainder after an overpayment', () => {
    const position = calculateDebtPosition({ ...openDebt, principal: 22_000 }, [], [payment(25_000, 22_000)], today);
    expect(position).toMatchObject({ paid: 25_000, remaining: 0, principalRemaining: 0 });
  });

  test('uses the schedule total when installments include interest', () => {
    const position = calculateDebtPosition({ ...openDebt, principal: 300_000 }, paylaterSchedule, [payment(105_000)], today);
    expect(position).toMatchObject({
      totalDue: 315_000,
      remaining: 210_000,
      principalRemaining: 195_000,
      nextDueDate: '2026-12-05',
      nextDueAmount: 105_000
    });
  });

  test('flags an overdue installment', () => {
    const position = calculateDebtPosition({ ...openDebt, principal: 300_000 }, paylaterSchedule, [], '2026-11-06');
    expect(position).toMatchObject({ nextDueDate: '2026-11-05', isOverdue: true });
  });

  test('has no next due date once every installment is paid', () => {
    const payments = [payment(105_000), payment(105_000), payment(105_000, 90_000)];
    const position = calculateDebtPosition({ ...openDebt, principal: 300_000 }, paylaterSchedule, payments, today);
    expect(position).toMatchObject({ remaining: 0, nextDueDate: null, nextDueAmount: null, isOverdue: false });
  });

  test('asks for what is left of a partly paid installment', () => {
    const position = calculateDebtPosition({ ...openDebt, principal: 300_000 }, paylaterSchedule, [payment(150_000)], today);
    expect(position).toMatchObject({ nextDueDate: '2026-12-05', nextDueAmount: 60_000 });
  });

  test('uses the debt due date when there is no schedule', () => {
    const position = calculateDebtPosition({ ...openDebt, dueDate: '2026-10-01' }, [], [payment(4_500)], today);
    expect(position).toMatchObject({ nextDueDate: '2026-10-01', nextDueAmount: 14_000, isOverdue: true });
  });

  test('owes nothing once the debt is closed', () => {
    const position = calculateDebtPosition({ ...openDebt, status: 'written_off', dueDate: '2026-10-01' }, [], [payment(1_000)], today);
    expect(position).toMatchObject({ remaining: 0, principalRemaining: 0, nextDueDate: null, isOverdue: false });
  });
});
