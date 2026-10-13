import { describe, expect, test } from 'bun:test';
import type { DefaultCategory } from '../types/bootstrap.types';
import { buildCategoryRows } from './build-category-rows';

const createIdGenerator = () => {
  let next = 0;
  return () => `id-${++next}`;
};

describe('buildCategoryRows', () => {
  test('returns no rows for an empty list', () => {
    expect(buildCategoryRows('ws', [], createIdGenerator())).toEqual([]);
  });

  test('creates a root row without a parent', () => {
    const defaults: DefaultCategory[] = [{ name: 'Gaji', type: 'income' }];

    expect(buildCategoryRows('ws', defaults, createIdGenerator())).toEqual([
      { id: 'id-1', workspaceId: 'ws', name: 'Gaji', type: 'income' }
    ]);
  });

  test('places children right after their parent and links parentId', () => {
    const defaults: DefaultCategory[] = [
      { name: 'Makanan', type: 'expense', children: ['Makan di luar', 'Belanja dapur'] }
    ];

    const rows = buildCategoryRows('ws', defaults, createIdGenerator());

    expect(rows.map((row) => [row.name, row.parentId])).toEqual([
      ['Makanan', undefined],
      ['Makan di luar', 'id-1'],
      ['Belanja dapur', 'id-1']
    ]);
  });

  test('children inherit the type of their parent', () => {
    const defaults: DefaultCategory[] = [{ name: 'Gaji', type: 'income', children: ['Tetap'] }];

    const rows = buildCategoryRows('ws', defaults, createIdGenerator());

    expect(rows.map((row) => row.type)).toEqual(['income', 'income']);
  });

  test('gives every row a unique id', () => {
    const defaults: DefaultCategory[] = [
      { name: 'A', type: 'expense', children: ['A1'] },
      { name: 'B', type: 'expense' }
    ];

    const ids = buildCategoryRows('ws', defaults).map((row) => row.id);

    expect(new Set(ids).size).toBe(3);
  });
});
