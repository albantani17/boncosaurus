import { describe, expect, test } from 'bun:test';
import type { Account, Category } from '../../types/finance.types';
import { type TransactionDraft, validateTransaction } from './validate-transaction';

const now = new Date();
const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  workspaceId: 'ws',
  name: 'Cash',
  type: 'cash',
  currency: 'IDR',
  initialBalance: 0,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
});
const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  workspaceId: 'ws',
  parentId: null,
  name: 'Makanan',
  type: 'expense',
  icon: null,
  color: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});
const makeDraft = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
  type: 'expense',
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: null,
  amount: 1000,
  toAmount: null,
  ...overrides
});
const messageOf = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return (error as { code: string }).code;
  }
  return 'no-error';
};

describe('validateTransaction', () => {
  test('accepts an expense without a category', () => {
    expect(messageOf(() => validateTransaction(makeDraft(), { account: makeAccount() }))).toBe(
      'no-error'
    );
  });

  test('accepts an expense with a matching category', () => {
    const draft = makeDraft({ categoryId: 'cat-1' });

    expect(
      messageOf(() => validateTransaction(draft, { account: makeAccount(), category: makeCategory() }))
    ).toBe('no-error');
  });

  test('rejects a category of the other type', () => {
    const draft = makeDraft({ categoryId: 'cat-1' });
    const references = { account: makeAccount(), category: makeCategory({ type: 'income' }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('CATEGORY_TYPE_MISMATCH');
  });

  test('rejects an archived account', () => {
    const references = { account: makeAccount({ isArchived: true }) };

    expect(messageOf(() => validateTransaction(makeDraft(), references))).toBe('ARCHIVED_REFERENCE');
  });

  test('allows an archived account when it is explicitly allowed (unchanged on update)', () => {
    const references = { account: makeAccount({ isArchived: true }) };

    expect(
      messageOf(() => validateTransaction(makeDraft(), references, { allowArchivedIds: ['acc-1'] }))
    ).toBe('no-error');
  });

  test('rejects an archived category', () => {
    const draft = makeDraft({ categoryId: 'cat-1' });
    const references = { account: makeAccount(), category: makeCategory({ isArchived: true }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('ARCHIVED_REFERENCE');
  });

  test('rejects toAccountId on a non-transfer', () => {
    const draft = makeDraft({ toAccountId: 'acc-2' });

    expect(messageOf(() => validateTransaction(draft, { account: makeAccount() }))).toBe(
      'INVALID_TRANSFER_FIELDS'
    );
  });

  test('accepts a same-currency transfer without toAmount', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2' });
    const references = { account: makeAccount(), toAccount: makeAccount({ id: 'acc-2' }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('no-error');
  });

  test('rejects a transfer without a destination account', () => {
    const draft = makeDraft({ type: 'transfer' });

    expect(messageOf(() => validateTransaction(draft, { account: makeAccount() }))).toBe(
      'INVALID_TRANSFER_FIELDS'
    );
  });

  test('rejects a transfer to the same account', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-1' });
    const references = { account: makeAccount(), toAccount: makeAccount() };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('INVALID_TRANSFER_FIELDS');
  });

  test('rejects a transfer with a category', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2', categoryId: 'cat-1' });
    const references = { account: makeAccount(), toAccount: makeAccount({ id: 'acc-2' }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('INVALID_TRANSFER_FIELDS');
  });

  test('requires toAmount for a cross-currency transfer', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2' });
    const references = {
      account: makeAccount(),
      toAccount: makeAccount({ id: 'acc-2', currency: 'USD' })
    };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('TO_AMOUNT_REQUIRED');
  });

  test('accepts a cross-currency transfer with toAmount', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2', toAmount: 70 });
    const references = {
      account: makeAccount(),
      toAccount: makeAccount({ id: 'acc-2', currency: 'USD' })
    };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('no-error');
  });

  test('rejects toAmount on a same-currency transfer', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2', toAmount: 1000 });
    const references = { account: makeAccount(), toAccount: makeAccount({ id: 'acc-2' }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('INVALID_TRANSFER_FIELDS');
  });

  test('accepts an admin fee on a transfer', () => {
    const draft = makeDraft({ type: 'transfer', toAccountId: 'acc-2', fee: 2500 });
    const references = { account: makeAccount(), toAccount: makeAccount({ id: 'acc-2' }) };

    expect(messageOf(() => validateTransaction(draft, references))).toBe('no-error');
  });

  test('rejects a fee on an expense', () => {
    const draft = makeDraft({ type: 'expense', fee: 2500 });

    expect(messageOf(() => validateTransaction(draft, { account: makeAccount() }))).toBe('INVALID_TRANSFER_FIELDS');
  });
});
