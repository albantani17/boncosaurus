import { describe, expect, test } from 'bun:test';
import { detectFileKind } from './detect-file-kind';

describe('detectFileKind', () => {
  test('maps csv and tsv to csv', () => {
    expect(detectFileKind('mutasi.csv')).toBe('csv');
    expect(detectFileKind('mutasi.TSV')).toBe('csv');
  });

  test('maps xlsx and pdf', () => {
    expect(detectFileKind('data.xlsx')).toBe('xlsx');
    expect(detectFileKind('rekening.pdf')).toBe('pdf');
  });

  test('maps json and txt to text', () => {
    expect(detectFileKind('export.json')).toBe('text');
    expect(detectFileKind('catatan.txt')).toBe('text');
  });

  test('uses the last extension of a name with several dots', () => {
    expect(detectFileKind('mutasi.2025.03.csv')).toBe('csv');
  });

  test('returns null for unsupported or missing extensions', () => {
    expect(detectFileKind('old.xls')).toBeNull();
    expect(detectFileKind('foto.png')).toBeNull();
    expect(detectFileKind('README')).toBeNull();
  });
});
