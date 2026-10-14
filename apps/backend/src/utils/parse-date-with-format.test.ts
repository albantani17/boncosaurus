import { describe, expect, test } from 'bun:test';
import { parseDateWithFormat } from './parse-date-with-format';

const WIB = 7 * 60;

describe('parseDateWithFormat', () => {
  test('parses dd/MM/yyyy and defaults the time to noon local', () => {
    const date = parseDateWithFormat('05/03/2025', 'dd/MM/yyyy', WIB);
    expect(date?.toISOString()).toBe('2025-03-05T05:00:00.000Z');
  });

  test('parses ISO yyyy-MM-dd', () => {
    expect(parseDateWithFormat('2025-12-31', 'yyyy-MM-dd', 0)?.toISOString()).toBe('2025-12-31T12:00:00.000Z');
  });

  test('uses the time when the format has HH:mm', () => {
    const date = parseDateWithFormat('05/03/2025 08:30', 'dd/MM/yyyy HH:mm', WIB);
    expect(date?.toISOString()).toBe('2025-03-05T01:30:00.000Z');
  });

  test('expands a two-digit year to 20xx', () => {
    expect(parseDateWithFormat('5-3-25', 'd-M-yy', 0)?.getUTCFullYear()).toBe(2025);
  });

  test('parses Indonesian month names', () => {
    expect(parseDateWithFormat('17 Agu 2025', 'd MMM yyyy', 0)?.toISOString()).toBe('2025-08-17T12:00:00.000Z');
  });

  test('parses English month names', () => {
    expect(parseDateWithFormat('3 March 2025', 'd MMMM yyyy', 0)?.toISOString()).toBe('2025-03-03T12:00:00.000Z');
  });

  test('ignores surrounding whitespace', () => {
    expect(parseDateWithFormat('  2025-01-02 ', 'yyyy-MM-dd', 0)).not.toBeNull();
  });

  test('returns null when the text does not match the format', () => {
    expect(parseDateWithFormat('2025-03-05', 'dd/MM/yyyy', 0)).toBeNull();
  });

  test('returns null for an impossible calendar date', () => {
    expect(parseDateWithFormat('31/02/2025', 'dd/MM/yyyy', 0)).toBeNull();
    expect(parseDateWithFormat('01/13/2025', 'dd/MM/yyyy', 0)).toBeNull();
  });
});
