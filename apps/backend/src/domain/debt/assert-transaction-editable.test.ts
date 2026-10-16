import { describe, expect, test } from 'bun:test';
import type { Transaction } from '../../types/finance.types';
import { assertTransactionDeletable, assertTransactionEditable } from './assert-transaction-editable';

const expense = { type: 'expense', amount: 100_000, debtRole: null } as Transaction;
const debtTransaction = { ...expense, debtId: 'debt', debtRole: 'principal' } as Transaction;
const noSplit = { splitTotal: 0, currencyBefore: 'IDR', currencyAfter: 'IDR' };
const withSplit = { ...noSplit, splitTotal: 60_000 };

const check = (existing: Transaction, patch: Partial<Transaction>, split = noSplit) =>
  () => assertTransactionEditable(existing, { ...existing, ...patch }, patch, split);

describe('assertTransactionEditable', () => {
  test('allows any change to a plain transaction', () => {
    expect(check(expense, { amount: 1, type: 'income' })).not.toThrow();
  });

  test('allows editing only the note of a debt transaction', () => {
    expect(check(debtTransaction, { note: 'kembalian' })).not.toThrow();
    expect(check(debtTransaction, { note: 'x', amount: undefined })).not.toThrow();
  });

  test('accepts a full form that repeats the locked values unchanged', () => {
    const occurredAt = new Date('2026-10-14T03:00:00Z');
    const existing = { ...debtTransaction, accountId: 'acc', occurredAt } as Transaction;
    const resubmitted = { type: 'expense' as const, amount: 100_000, accountId: 'acc', occurredAt: new Date(occurredAt), note: 'x' };
    expect(check(existing, resubmitted)).not.toThrow();
  });

  test('locks the amount, account and date of a debt transaction', () => {
    for (const patch of [{ amount: 1 }, { accountId: 'other' }, { occurredAt: new Date(0) }]) {
      expect(check(debtTransaction, patch)).toThrow(expect.objectContaining({ code: 'DEBT_TRANSACTION_LOCKED' }));
    }
  });

  test('allows a split expense to change as long as the shares still fit', () => {
    expect(check(expense, { amount: 60_000 }, withSplit)).not.toThrow();
  });

  test('keeps a split expense an expense', () => {
    expect(check(expense, { type: 'income' }, withSplit)).toThrow(expect.objectContaining({ code: 'DEBT_TRANSACTION_LOCKED' }));
  });

  test('keeps the currency of a split expense', () => {
    expect(check(expense, { accountId: 'usd' }, { ...withSplit, currencyAfter: 'USD' })).toThrow(
      expect.objectContaining({ code: 'CURRENCY_MISMATCH' })
    );
  });

  test('rejects lowering a split expense below its shares', () => {
    expect(check(expense, { amount: 59_999 }, withSplit)).toThrow(
      expect.objectContaining({ code: 'DEBT_SPLIT_EXCEEDS_TRANSACTION' })
    );
  });
});

describe('assertTransactionDeletable', () => {
  test('allows deleting a plain transaction', () => {
    expect(() => assertTransactionDeletable(expense, 0)).not.toThrow();
  });

  test('rejects deleting a debt transaction', () => {
    expect(() => assertTransactionDeletable(debtTransaction, 0)).toThrow(
      expect.objectContaining({ code: 'DEBT_TRANSACTION_LOCKED' })
    );
  });

  test('rejects deleting an expense that others still owe part of', () => {
    expect(() => assertTransactionDeletable(expense, 1)).toThrow(expect.objectContaining({ code: 'DEBT_TRANSACTION_LOCKED' }));
  });
});
