import { describe, expect, test } from 'bun:test';
import { extractXlsx } from './extract-xlsx';

const readFixture = async (name: string) => new Uint8Array(await Bun.file(`${import.meta.dir}/fixtures/${name}`).arrayBuffer());

describe('extractXlsx', () => {
  test('reads the first sheet as string rows', async () => {
    const content = await extractXlsx(await readFixture('statement.xlsx'));
    expect(content).toEqual({
      kind: 'table',
      rows: [
        ['Tanggal', 'Keterangan', 'Jumlah'],
        ['2025-03-05', 'Kopi', '-25000'],
        ['2025-03-06', 'Gaji', '5000000']
      ]
    });
  });

  test('rejects a spreadsheet without rows', async () => {
    await expect(extractXlsx(await readFixture('empty.xlsx'))).rejects.toMatchObject({
      status: 400,
      code: 'IMPORT_UNREADABLE',
      message: 'The spreadsheet has no rows'
    });
  });

  test('rejects bytes that are not a spreadsheet', async () => {
    await expect(extractXlsx(new TextEncoder().encode('not a zip'))).rejects.toMatchObject({
      status: 400,
      code: 'IMPORT_UNREADABLE'
    });
  });
});
