import { describe, expect, test } from 'bun:test';
import { resolveSettlement } from './resolve-settlement';

const active = { status: 'active' as const, closedAt: null, principal: 22_000, dueDate: null };
const paidOn = (day: number, amount: number, principalAmount = amount) => ({
  amount,
  principalAmount,
  paidAt: new Date(`2026-10-${String(day).padStart(2, '0')}T00:00:00Z`)
});

describe('resolveSettlement', () => {
  test('keeps a debt open while something remains', () => {
    expect(resolveSettlement(active, [], [paidOn(1, 10_000)])).toEqual({ status: 'active', closedAt: null });
  });

  test('settles on the date of the latest payment', () => {
    expect(resolveSettlement(active, [], [paidOn(9, 10_000), paidOn(3, 15_000, 12_000)])).toEqual({
      status: 'settled',
      closedAt: new Date('2026-10-09T00:00:00Z')
    });
  });

  test('waits for the whole schedule, not just the principal', () => {
    const schedule = [{ sequence: 1, dueDate: '2026-11-01', amount: 25_000 }];
    expect(resolveSettlement(active, schedule, [paidOn(1, 22_000)]).status).toBe('active');
  });

  test('keeps the original closing date of a settled debt', () => {
    const settled = { ...active, status: 'settled' as const, closedAt: new Date('2026-10-02T00:00:00Z') };
    expect(resolveSettlement(settled, [], [paidOn(1, 22_000)])).toEqual({ status: 'settled', closedAt: settled.closedAt });
  });

  test('reopens a settled debt when a payment is removed', () => {
    const settled = { ...active, status: 'settled' as const, closedAt: new Date() };
    expect(resolveSettlement(settled, [], [])).toEqual({ status: 'active', closedAt: null });
  });

  test('leaves a written-off debt alone', () => {
    expect(resolveSettlement({ ...active, status: 'written_off' }, [], [])).toEqual({});
  });
});
