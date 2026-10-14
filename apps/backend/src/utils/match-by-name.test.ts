import { describe, expect, test } from 'bun:test';
import { findByName, normalizeName } from './match-by-name';

const items = [{ name: 'Makanan' }, { name: 'Gaji Bulanan' }];

describe('normalizeName', () => {
  test('lowercases, trims and collapses inner whitespace', () => {
    expect(normalizeName('  Gaji   BULANAN ')).toBe('gaji bulanan');
  });
});

describe('findByName', () => {
  test('finds an item ignoring case and extra whitespace', () => {
    expect(findByName(items, ' gaji  bulanan')).toBe(items[1]);
  });

  test('returns undefined when no item matches', () => {
    expect(findByName(items, 'Transport')).toBeUndefined();
  });

  test('returns undefined for an empty name', () => {
    expect(findByName(items, '  ')).toBeUndefined();
  });
});
