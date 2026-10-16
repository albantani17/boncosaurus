import { describe, expect, test } from 'bun:test';
import type { Account, Category, Transaction } from '../../types/finance.types';
import { type DebtOriginDraft, validateDebtOrigin } from './validate-debt-origin';

const account = { id: 'acc', currency: 'IDR', isArchived: false } as Account;
const expenseCategory = { id: 'cat', type: 'expense', isArchived: false } as Category;
const expense = { id: 'tx', type: 'expense', amount: 100_000, debtRole: null } as Transaction;

const cash: DebtOriginDraft = { direction: 'receivable', origin: 'cash', principal: 30_000, accountId: 'acc' };
const split: DebtOriginDraft = { direction: 'receivable', origin: 'split', principal: 60_000, originTransactionId: 'tx' };
const purchase: DebtOriginDraft = {
  direction: 'payable',
  origin: 'purchase',
  principal: 300_000,
  categoryId: 'cat',
  currency: 'IDR'
};
const originOf = (overrides: Partial<Transaction> = {}, splitTotal = 0) => ({
  originTransaction: { transaction: { ...expense, ...overrides }, account, splitTotal }
});

const rejects = (draft: DebtOriginDraft, references: Parameters<typeof validateDebtOrigin>[1], code: string) =>
  expect(() => validateDebtOrigin(draft, references)).toThrow(expect.objectContaining({ code }));

describe('validateDebtOrigin', () => {
  describe('cash', () => {
    test('accepts an active account', () => {
      expect(() => validateDebtOrigin(cash, { account })).not.toThrow();
    });

    test('requires an account', () => rejects(cash, {}, 'INVALID_DEBT_ORIGIN'));

    test('rejects a category or origin transaction', () => {
      rejects({ ...cash, categoryId: 'cat' }, { account }, 'INVALID_DEBT_ORIGIN');
      rejects({ ...cash, originTransactionId: 'tx' }, { account }, 'INVALID_DEBT_ORIGIN');
    });

    test('rejects an archived account', () => rejects(cash, { account: { ...account, isArchived: true } }, 'ARCHIVED_REFERENCE'));
  });

  describe('split', () => {
    test('accepts a share that fits in the expense', () => {
      expect(() => validateDebtOrigin(split, originOf({}, 40_000))).not.toThrow();
    });

    test('only allows receivables', () => rejects({ ...split, direction: 'payable' }, originOf(), 'INVALID_DEBT_ORIGIN'));

    test('rejects an account or category', () => {
      rejects({ ...split, accountId: 'acc' }, originOf(), 'INVALID_DEBT_ORIGIN');
      rejects({ ...split, categoryId: 'cat' }, originOf(), 'INVALID_DEBT_ORIGIN');
    });

    test('requires the original transaction', () => rejects(split, {}, 'INVALID_DEBT_ORIGIN'));

    test('rejects an income or a debt transaction', () => {
      rejects(split, originOf({ type: 'income' }), 'INVALID_DEBT_ORIGIN');
      rejects(split, originOf({ debtRole: 'principal' }), 'INVALID_DEBT_ORIGIN');
    });

    test('rejects shares that add up to more than the expense', () =>
      rejects(split, originOf({}, 40_001), 'DEBT_SPLIT_EXCEEDS_TRANSACTION'));
  });

  describe('purchase', () => {
    test('accepts an expense category and a currency', () => {
      expect(() => validateDebtOrigin(purchase, { category: expenseCategory })).not.toThrow();
    });

    test('only allows payables', () =>
      rejects({ ...purchase, direction: 'receivable' }, { category: expenseCategory }, 'INVALID_DEBT_ORIGIN'));

    test('rejects an account or origin transaction', () => {
      rejects({ ...purchase, accountId: 'acc' }, { category: expenseCategory }, 'INVALID_DEBT_ORIGIN');
      rejects({ ...purchase, originTransactionId: 'tx' }, { category: expenseCategory }, 'INVALID_DEBT_ORIGIN');
    });

    test('requires a currency and a category', () => {
      rejects({ ...purchase, currency: null }, { category: expenseCategory }, 'INVALID_DEBT_ORIGIN');
      rejects(purchase, {}, 'INVALID_DEBT_ORIGIN');
    });

    test('rejects an income category', () =>
      rejects(purchase, { category: { ...expenseCategory, type: 'income' } }, 'CATEGORY_TYPE_MISMATCH'));

    test('rejects an archived category', () =>
      rejects(purchase, { category: { ...expenseCategory, isArchived: true } }, 'ARCHIVED_REFERENCE'));
  });
});
