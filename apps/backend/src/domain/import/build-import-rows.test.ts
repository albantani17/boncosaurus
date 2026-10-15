import { describe, expect, test } from 'bun:test';
import type { Account, Category } from '../../types/finance.types';
import type { RawTransaction } from '../../types/import.types';
import { type BuildImportRowsInput, buildImportRows } from './build-import-rows';

const account = (overrides: Partial<Account> = {}) =>
  ({ id: 'acc-1', name: 'BCA', type: 'bank', currency: 'IDR', isArchived: false, ...overrides }) as Account;
const category = (overrides: Partial<Category> = {}) =>
  ({ id: 'cat-1', name: 'Makan', type: 'expense', isArchived: false, ...overrides }) as Category;
const raw = (overrides: Partial<RawTransaction> = {}): RawTransaction => ({
  occurredAt: new Date('2026-10-01T05:00:00Z'),
  type: 'expense',
  amount: 25000,
  note: 'Warteg',
  accountName: 'BCA',
  categoryName: 'Makan',
  ...overrides
});
const build = (overrides: Partial<BuildImportRowsInput> = {}) =>
  buildImportRows({
    raw: [raw()],
    accounts: [account()],
    categories: [category()],
    existing: [],
    baseCurrency: 'IDR',
    fallbackAccountName: 'statement',
    utcOffsetMinutes: 420,
    ...overrides
  });

describe('buildImportRows', () => {
  test('matches existing account and category case-insensitively', () => {
    const result = build({ raw: [raw({ accountName: ' bca ', categoryName: 'MAKAN' })] });
    expect(result.accounts).toEqual([{ name: 'BCA', accountId: 'acc-1', type: 'bank', currency: 'IDR' }]);
    expect(result.categories).toEqual([{ name: 'Makan', categoryId: 'cat-1', type: 'expense' }]);
    expect(result.rows[0]!.issues).toEqual([]);
  });

  test('proposes new accounts and categories once per name', () => {
    const result = build({
      raw: [raw({ accountName: 'Dana', categoryName: 'Kopi' }), raw({ accountName: 'dana', categoryName: 'kopi' })],
      accounts: [],
      categories: []
    });
    expect(result.accounts).toEqual([{ name: 'Dana', accountId: null, type: 'bank', currency: 'IDR' }]);
    expect(result.categories).toEqual([{ name: 'Kopi', categoryId: null, type: 'expense' }]);
    expect(result.rows.map((row) => row.issues)).toEqual([[], []]);
  });

  test('uses the fallback account name when the row has none', () => {
    const result = build({ raw: [raw({ accountName: null })], accounts: [] });
    expect(result.rows[0]!.accountName).toBe('statement');
    expect(result.accounts[0]!.name).toBe('statement');
  });

  test('flags rows that match an existing transaction as duplicates', () => {
    const existing = [{ accountId: 'acc-1', occurredAt: new Date('2026-10-01T06:00:00Z'), type: 'expense' as const, amount: 25000, note: 'warteg' }];
    const result = build({ raw: [raw(), raw()], existing });
    expect(result.rows.map((row) => row.duplicate)).toEqual([true, false]);
  });

  test('never marks rows of a new account as duplicates', () => {
    const existing = [{ accountId: 'acc-1', occurredAt: new Date('2026-10-01T06:00:00Z'), type: 'expense' as const, amount: 25000, note: 'Warteg' }];
    expect(build({ existing, accounts: [] }).rows[0]!.duplicate).toBe(false);
  });

  test('reports an issue for a category of the wrong type', () => {
    const result = build({ raw: [raw({ type: 'income' })] });
    expect(result.rows[0]!.issues).toEqual(['Category type does not match the transaction type']);
  });

  test('reports an issue for an archived account', () => {
    const result = build({ accounts: [account({ isArchived: true })] });
    expect(result.rows[0]!.issues).toEqual(['Account is archived']);
  });

  test('rethrows errors that are not validation failures', () => {
    const broken = Object.defineProperty(account(), 'isArchived', {
      get: () => {
        throw new TypeError('broken record');
      }
    });
    expect(() => build({ accounts: [broken] })).toThrow('broken record');
  });

  test('reports an issue for a non-positive amount', () => {
    expect(build({ raw: [raw({ amount: 0 })] }).rows[0]!.issues).toEqual(['Invalid amount']);
  });
});
