import { describe, expect, test } from 'bun:test';
import { extractCsv } from './extract-csv';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('extractCsv', () => {
  test('reads comma separated rows', async () => {
    expect(await extractCsv(bytes('a,b\n1,2\n'))).toEqual({ kind: 'table', rows: [['a', 'b'], ['1', '2']] });
  });

  test('detects semicolon and tab delimiters', async () => {
    expect(await extractCsv(bytes('a;b\n1;2'))).toEqual({ kind: 'table', rows: [['a', 'b'], ['1', '2']] });
    const tsv = await extractCsv(bytes('a\tb\n1\t2'));
    expect(tsv).toEqual({ kind: 'table', rows: [['a', 'b'], ['1', '2']] });
  });

  test('keeps commas inside quoted fields', async () => {
    const result = await extractCsv(bytes('a,b\n"x, y",2'));
    expect(result).toEqual({ kind: 'table', rows: [['a', 'b'], ['x, y', '2']] });
  });

  test('strips a UTF-8 byte order mark', async () => {
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('a,b\n1,2')]);
    expect(await extractCsv(withBom)).toEqual({ kind: 'table', rows: [['a', 'b'], ['1', '2']] });
  });

  test('drops fully empty trailing lines', async () => {
    expect(await extractCsv(bytes('a,b\n1,2\n\n\n'))).toEqual({ kind: 'table', rows: [['a', 'b'], ['1', '2']] });
  });

  test('rejects a file with no rows', async () => {
    await expect(extractCsv(bytes('  \n'))).rejects.toMatchObject({ status: 400, code: 'IMPORT_UNREADABLE' });
  });
});
