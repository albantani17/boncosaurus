import { describe, expect, test } from 'bun:test';
import { extractPdf } from './extract-pdf';

const readFixture = async (name: string) => new Uint8Array(await Bun.file(`${import.meta.dir}/fixtures/${name}`).arrayBuffer());

describe('extractPdf', () => {
  test('extracts the text of every page', async () => {
    const content = await extractPdf(await readFixture('statement.pdf'));
    expect(content.kind).toBe('text');
    if (content.kind === 'text') {
      expect(content.text).toContain('Kopi Kenangan');
      expect(content.text).toContain('5.000.000,00');
    }
  });

  test('rejects a pdf without text, such as a scan', async () => {
    await expect(extractPdf(await readFixture('blank.pdf'))).rejects.toMatchObject({
      status: 400,
      code: 'IMPORT_NO_TEXT'
    });
  });

  test('rejects bytes that are not a pdf', async () => {
    await expect(extractPdf(new TextEncoder().encode('nope'))).rejects.toMatchObject({
      status: 400,
      code: 'IMPORT_UNREADABLE'
    });
  });
});
