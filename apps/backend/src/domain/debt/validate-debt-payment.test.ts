import { describe, expect, test } from 'bun:test';
import type { Account, Category } from '../../types/finance.types';
import { validateDebtPayment } from './validate-debt-payment';

const debt = { status: 'active' as const, currency: 'IDR', direction: 'receivable' as const };
const account = { currency: 'IDR', isArchived: false } as Account;
const incomeCategory = { type: 'income', isArchived: false } as Category;

const rejects = (args: Parameters<typeof validateDebtPayment>, code: string) =>
  expect(() => validateDebtPayment(...args)).toThrow(expect.objectContaining({ code }));

describe('validateDebtPayment', () => {
  test('accepts a payment into an account of the same currency', () => {
    expect(() => validateDebtPayment(debt, { account })).not.toThrow();
  });

  test('accepts an extra category matching the cash flow', () => {
    expect(() => validateDebtPayment(debt, { account, extraCategory: incomeCategory })).not.toThrow();
    expect(() =>
      validateDebtPayment({ ...debt, direction: 'payable' }, { account, extraCategory: { ...incomeCategory, type: 'expense' } })
    ).not.toThrow();
  });

  test('rejects a closed debt', () => rejects([{ ...debt, status: 'settled' }, { account }], 'DEBT_ALREADY_CLOSED'));

  test('rejects an archived account', () =>
    rejects([debt, { account: { ...account, isArchived: true } }], 'ARCHIVED_REFERENCE'));

  test('rejects an account in another currency', () =>
    rejects([debt, { account: { ...account, currency: 'USD' } }], 'CURRENCY_MISMATCH'));

  test('rejects an archived extra category', () =>
    rejects([debt, { account, extraCategory: { ...incomeCategory, isArchived: true } }], 'ARCHIVED_REFERENCE'));

  test('rejects an extra category of the wrong type', () =>
    rejects([debt, { account, extraCategory: { ...incomeCategory, type: 'expense' } }], 'CATEGORY_TYPE_MISMATCH'));
});
