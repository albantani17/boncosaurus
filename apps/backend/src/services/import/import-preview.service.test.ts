import { describe, expect, test } from 'bun:test';
import type { Account, Category } from '../../types/finance.types';
import type { ColumnMapping } from '../../types/import.types';
import type { ImportAi } from './import-ai';
import { createRecordingLogger } from '../../integrations/logging/create-recording-logger';
import { createImportPreviewService } from './import-preview.service';

const actor = { userId: 'user-1', workspaceId: 'ws-1' };
const bca = { id: 'acc-1', name: 'BCA', type: 'bank', currency: 'IDR', isArchived: false } as Account;
const makan = { id: 'cat-1', name: 'Makan', type: 'expense', isArchived: false } as Category;

const mapping: ColumnMapping = {
  headerRows: 1, dateColumn: 0, dateFormat: 'dd/MM/yyyy', descriptionColumn: 1, amountColumn: 2,
  debitColumn: null, creditColumn: null, typeColumn: null, incomeValues: [], expenseValues: [],
  accountColumn: null, categoryColumn: null, decimalSeparator: ',', negativeMeansExpense: true, defaultAccountName: 'BCA'
};

function setup(overrides: Partial<ImportAi> = {}) {
  const calls = { categorize: 0 };
  const ai: ImportAi = {
    inferColumnMapping: async () => mapping,
    extractTransactions: async () => [],
    categorize: async (_call, items) => {
      calls.categorize++;
      return items.map((item) => ({ ...item, categoryName: 'Makan' }));
    },
    ...overrides
  };
  const recorder = createRecordingLogger();
  const service = createImportPreviewService({
    ai,
    providers: { resolveProvider: async () => ({ providerId: 'p', settings: { kind: 'openai', model: 'm', baseUrl: null, apiKey: null } }) },
    workspaces: { listForUser: async () => [{ id: 'ws-1', name: 'W', baseCurrency: 'IDR', role: 'owner' }] },
    accounts: { list: async () => [bca] },
    categories: { list: async () => [makan] },
    imports: { listTransactionsInRange: async () => [] },
    now: () => new Date('2026-10-15T02:00:00Z'),
    logger: recorder.logger
  });
  return { service, calls, events: recorder.events };
}

const csv = (text: string) => new TextEncoder().encode(text);

describe('previewImport', () => {
  test('maps a table, categorizes it and matches the existing account', async () => {
    const { service, calls } = setup();
    const preview = await service.previewImport(actor, {
      fileName: 'mutasi.csv',
      bytes: csv('Tanggal,Ket,Jumlah\n01/10/2026,Warteg,"-25000"\n02/10/2026,Warteg,"-30000"\n'),
      utcOffsetMinutes: 420
    });
    expect(preview.kind).toBe('csv');
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]).toMatchObject({ type: 'expense', amount: 25000, accountName: 'BCA', categoryName: 'Makan', duplicate: false, issues: [] });
    expect(preview.accounts).toEqual([{ name: 'BCA', accountId: 'acc-1', type: 'bank', currency: 'IDR' }]);
    expect(calls.categorize).toBe(1);
  });

  test('extracts text files through the AI per chunk', async () => {
    const { service } = setup({
      extractTransactions: async () => [
        { occurredAt: new Date('2026-10-01T05:00:00Z'), type: 'income', amount: 1000, note: 'Gaji', accountName: null, categoryName: 'Gaji' }
      ]
    });
    const preview = await service.previewImport(actor, { fileName: 'statement.txt', bytes: csv('01 Okt Gaji 1000') });
    expect(preview.rows[0]).toMatchObject({ type: 'income', accountName: 'statement', categoryName: 'Gaji' });
    expect(preview.categories).toEqual([{ name: 'Gaji', categoryId: null, type: 'income' }]);
  });

  test('reads xlsx files as tables', async () => {
    const bytes = new Uint8Array(await Bun.file(`${import.meta.dir}/../../integrations/files/fixtures/statement.xlsx`).arrayBuffer());
    const { service } = setup({ inferColumnMapping: async () => ({ ...mapping, dateFormat: 'yyyy-MM-dd', decimalSeparator: '.' }) });

    const preview = await service.previewImport(actor, { fileName: 'mutasi.xlsx', bytes });

    expect(preview.kind).toBe('xlsx');
    expect(preview.rows.map((row) => [row.type, row.amount])).toEqual([
      ['expense', 25000],
      ['income', 5000000]
    ]);
  });

  test('reads pdf files as text for the AI', async () => {
    const bytes = new Uint8Array(await Bun.file(`${import.meta.dir}/../../integrations/files/fixtures/statement.pdf`).arrayBuffer());
    const chunks: string[] = [];
    const { service } = setup({
      extractTransactions: async (_call, chunk) => {
        chunks.push(chunk);
        return [{ occurredAt: new Date('2025-03-05T05:00:00Z'), type: 'expense', amount: 25000, note: 'Kopi Kenangan', accountName: null, categoryName: 'Makan' }];
      }
    });

    const preview = await service.previewImport(actor, { fileName: 'rekening.pdf', bytes });

    expect(preview.kind).toBe('pdf');
    expect(chunks.join('')).toContain('Kopi Kenangan');
    expect(preview.rows[0]).toMatchObject({ accountName: 'rekening', categoryName: 'Makan' });
  });

  test('warns about rows the mapping could not read', async () => {
    const { service } = setup();
    const preview = await service.previewImport(actor, {
      fileName: 'mutasi.csv',
      bytes: csv('Tanggal,Ket,Jumlah\nbukan tanggal,X,"-1"\n01/10/2026,Warteg,"-25000"\n')
    });
    expect(preview.rows).toHaveLength(1);
    expect(preview.warnings).toEqual(['1 baris dilewati karena tidak bisa dibaca (baris 2…)']);
  });

  test('rejects a table with more than 2000 rows before calling the AI', async () => {
    let mappingCalls = 0;
    const { service } = setup({ inferColumnMapping: async () => (mappingCalls++, mapping) });
    const body = '01/10/2026,Warteg,-1\n'.repeat(2026);
    await expect(
      service.previewImport(actor, { fileName: 'a.csv', bytes: csv(`Tanggal,Ket,Jumlah\n${body}`) })
    ).rejects.toMatchObject({ code: 'IMPORT_TOO_MANY_ROWS' });
    expect(mappingCalls).toBe(0);
  });

  test('rejects text that yields more than 2000 transactions', async () => {
    const transaction = { occurredAt: new Date('2026-10-01T05:00:00Z'), type: 'expense' as const, amount: 1, note: 'x', accountName: null, categoryName: null };
    const { service, calls } = setup({ extractTransactions: async () => Array.from({ length: 2001 }, () => transaction) });
    await expect(service.previewImport(actor, { fileName: 'a.txt', bytes: csv('isi') })).rejects.toMatchObject({
      code: 'IMPORT_TOO_MANY_ROWS'
    });
    expect(calls.categorize).toBe(0);
  });

  test('rejects users who are not members of the workspace', async () => {
    const { service } = setup();
    await expect(
      service.previewImport({ ...actor, workspaceId: 'other' }, { fileName: 'a.csv', bytes: csv('Tanggal,Ket,Jumlah\n') })
    ).rejects.toMatchObject({ code: 'NOT_A_MEMBER' });
  });

  test('rejects unsupported file types', async () => {
    await expect(setup().service.previewImport(actor, { fileName: 'a.xls', bytes: csv('x') })).rejects.toMatchObject({ code: 'IMPORT_UNSUPPORTED_FILE' });
  });

  test('rejects files over 5 MB', async () => {
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
    await expect(setup().service.previewImport(actor, { fileName: 'a.csv', bytes })).rejects.toMatchObject({ code: 'IMPORT_TOO_LARGE' });
  });

  test('rejects a file with no transactions', async () => {
    await expect(setup().service.previewImport(actor, { fileName: 'a.csv', bytes: csv('Tanggal,Ket,Jumlah\n') })).rejects.toMatchObject({ code: 'IMPORT_EMPTY' });
  });

  test('turns AI failures into a bad gateway error', async () => {
    const { service, events } = setup({ inferColumnMapping: async () => { throw new Error('model offline'); } });
    await expect(service.previewImport(actor, { fileName: 'a.csv', bytes: csv('a,b,c\n1,2,3') })).rejects.toMatchObject({
      status: 502, code: 'AI_REQUEST_FAILED'
    });
    expect(events()).toEqual(['import.ai_failed']);
  });
});
