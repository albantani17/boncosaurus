import { describe, expect, test } from 'bun:test';
import { calculateAccountBalance } from './calculate-account-balance';

describe('calculateAccountBalance', () => {
  test('returns the initial balance when there are no transactions', () => {
    expect(calculateAccountBalance(1000)).toBe(1000);
  });

  test('adds income and subtracts expense', () => {
    const outgoing = { accountId: 'a', income: 500, expense: 200, transferOut: 0 };

    expect(calculateAccountBalance(1000, outgoing)).toBe(1300);
  });

  test('subtracts transfers out and adds transfers in', () => {
    const outgoing = { accountId: 'a', income: 0, expense: 0, transferOut: 300 };
    const incoming = { accountId: 'a', transferIn: 800 };

    expect(calculateAccountBalance(100, outgoing, incoming)).toBe(600);
  });

  test('can go negative (e.g. credit card)', () => {
    const outgoing = { accountId: 'a', income: 0, expense: 700, transferOut: 0 };

    expect(calculateAccountBalance(0, outgoing)).toBe(-700);
  });
});
