import { describe, expect, test } from 'bun:test';
import { mergeDefined } from './merge-defined';

describe('mergeDefined', () => {
  test('overrides base values with patch values', () => {
    expect(mergeDefined({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });

  test('ignores undefined values in the patch', () => {
    expect(mergeDefined({ a: 1, b: 2 }, { a: undefined, b: 3 })).toEqual({ a: 1, b: 3 });
  });

  test('keeps null from the patch so a value can be cleared', () => {
    expect(mergeDefined<{ note: string | null }>({ note: 'x' }, { note: null })).toEqual({
      note: null
    });
  });

  test('does not mutate the base object', () => {
    const base = { a: 1 };

    mergeDefined(base, { a: 2 });

    expect(base).toEqual({ a: 1 });
  });
});
