import { describe, expect, test } from 'bun:test';
import type { Account, Category } from '../../types/finance.types';
import type { ImportBatch } from '../../repositories/import.repository';
import type { ImportCommitPayload } from '../../types/import.types';
import { createImportCommitService } from './import-commit.service';

const actor = { userId: 'user-1', workspaceId: 'ws-1' };
const bca = { id: 'acc-1', name: 'BCA', type: 'bank', currency: 'IDR', isArchived: false } as Account;
const makan = { id: 'cat-1', name: 'Makan', type: 'expense', isArchived: false } as Category;

function setup(accounts: Account[] = [bca], categories: Category[] = [makan]) {
  const batches: ImportBatch[] = [];
  let counter = 0;
  const service = createImportCommitService({
    accounts: { list: async () => accounts },
    categories: { list: async () => categories },
    imports: { commit: async (batch) => void batches.push(batch) },
    generateId: () => `new-${++counter}`
  });
  return { service, batches };
}

const payload = (overrides: Partial<ImportCommitPayload> = {}): ImportCommitPayload => ({
  accounts: [{ name: 'BCA', accountId: 'acc-1', type: 'bank', currency: 'IDR' }],
  categories: [{ name: 'Makan', categoryId: 'cat-1', type: 'expense' }],
  rows: [{ occurredAt: '2026-10-01T05:00:00.000Z', type: 'expense', amount: 25000, accountName: 'BCA', categoryName: 'Makan', note: ' Warteg ' }],
  ...overrides
});

describe('commitImport', () => {
  test('saves rows as import transactions created by the user', async () => {
    const { service, batches } = setup();
    const result = await service.commitImport(actor, payload());
    expect(result).toEqual({ createdAccounts: 0, createdCategories: 0, createdTransactions: 1 });
    expect(batches[0]!.transactions[0]).toMatchObject({
      workspaceId: 'ws-1', accountId: 'acc-1', categoryId: 'cat-1', amount: 25000, note: 'Warteg', source: 'import', createdBy: 'user-1'
    });
  });

  test('creates new accounts and categories and points rows at them', async () => {
    const { service, batches } = setup([], []);
    const result = await service.commitImport(actor, payload({
      accounts: [{ name: 'Dana', accountId: null, type: 'ewallet', currency: 'IDR' }],
      categories: [{ name: 'Kopi', categoryId: null, type: 'expense' }],
      rows: [{ occurredAt: '2026-10-01T05:00:00.000Z', type: 'expense', amount: 1000, accountName: 'dana', categoryName: 'Kopi', note: '' }]
    }));
    expect(result).toMatchObject({ createdAccounts: 1, createdCategories: 1 });
    const [batch] = batches;
    expect(batch!.accounts[0]).toMatchObject({ id: 'new-1', name: 'Dana', type: 'ewallet' });
    expect(batch!.transactions[0]).toMatchObject({ accountId: 'new-1', categoryId: 'new-2', note: null });
  });

  test('reuses an existing account when a new draft collides by name', async () => {
    const { service, batches } = setup();
    await service.commitImport(actor, payload({ accounts: [{ name: 'bca', accountId: null, type: 'cash', currency: 'IDR' }] }));
    expect(batches[0]!.accounts).toEqual([]);
    expect(batches[0]!.transactions[0]!.accountId).toBe('acc-1');
  });

  test('rejects an account id outside the workspace', async () => {
    const { service } = setup();
    await expect(service.commitImport(actor, payload({ accounts: [{ name: 'X', accountId: 'other', type: 'bank', currency: 'IDR' }] }))).rejects.toMatchObject({ status: 404 });
  });

  test('rejects a row whose category type does not match', async () => {
    const { service, batches } = setup();
    const bad = payload({ rows: [{ ...payload().rows[0]!, type: 'income' }] });
    await expect(service.commitImport(actor, bad)).rejects.toMatchObject({ code: 'IMPORT_INVALID_ROW' });
    expect(batches).toHaveLength(0);
  });

  test('rejects a row that references an unknown account name', async () => {
    const { service } = setup();
    const bad = payload({ rows: [{ ...payload().rows[0]!, accountName: 'Ghost' }] });
    await expect(service.commitImport(actor, bad)).rejects.toMatchObject({ code: 'IMPORT_INVALID_ROW' });
  });

  test('rejects an empty import', async () => {
    const { service } = setup();
    await expect(service.commitImport(actor, payload({ rows: [] }))).rejects.toMatchObject({ code: 'IMPORT_EMPTY' });
  });

  test('rejects more than 2000 rows', async () => {
    const { service, batches } = setup();
    const rows = Array.from({ length: 2001 }, () => payload().rows[0]!);
    await expect(service.commitImport(actor, payload({ rows }))).rejects.toMatchObject({ code: 'IMPORT_TOO_MANY_ROWS' });
    expect(batches).toEqual([]);
  });
});
