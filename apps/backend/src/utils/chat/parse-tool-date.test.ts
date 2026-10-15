import { describe, expect, test } from 'bun:test';
import { parseToolDate } from './parse-tool-date';

describe('parseToolDate', () => {
  test('parses a datetime with an offset', () => {
    expect(parseToolDate('2026-10-01T00:00:00+07:00')?.toISOString()).toBe('2026-09-30T17:00:00.000Z');
  });

  test('parses a UTC datetime', () => {
    expect(parseToolDate('2026-10-01T08:30Z')?.toISOString()).toBe('2026-10-01T08:30:00.000Z');
  });

  test('rejects a datetime without an offset', () => {
    expect(parseToolDate('2026-10-01T00:00:00')).toBeNull();
  });

  test('rejects a plain date', () => {
    expect(parseToolDate('2026-10-01')).toBeNull();
  });

  test('rejects an impossible date', () => {
    expect(parseToolDate('2026-13-45T00:00:00Z')).toBeNull();
  });
});
