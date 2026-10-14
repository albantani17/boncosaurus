import { describe, expect, test } from 'bun:test';
import type { Category, CategoryTotal } from '../types/api.types';
import { buildCategoryBreakdown } from './build-category-breakdown';

const makeCategory = (id: string, name: string): Category => ({
	id,
	name,
	type: 'expense',
	isArchived: false
});
const makeRow = (categoryId: string | null, total: number, overrides: Partial<CategoryTotal> = {}): CategoryTotal => ({
	categoryId,
	type: 'expense',
	currency: 'IDR',
	total,
	...overrides
});

describe('buildCategoryBreakdown', () => {
	test('names rows by category and sorts by largest total with percentages', () => {
		const result = buildCategoryBreakdown(
			[makeRow('a', 25), makeRow('b', 75)],
			[makeCategory('a', 'Transport'), makeCategory('b', 'Makanan')],
			'IDR'
		);

		expect(result).toEqual([
			{ label: 'Makanan', total: 75, percent: 75 },
			{ label: 'Transport', total: 25, percent: 25 }
		]);
	});

	test('labels rows without a category as "Tanpa kategori"', () => {
		expect(buildCategoryBreakdown([makeRow(null, 10)], [], 'IDR')[0]?.label).toBe('Tanpa kategori');
	});

	test('groups everything beyond the top five into "Lainnya"', () => {
		const rows = [60, 50, 40, 30, 20, 10, 5].map((total, index) => makeRow(`c${index}`, total));
		const categories = rows.map((row) => makeCategory(row.categoryId!, `Kat ${row.categoryId}`));

		const result = buildCategoryBreakdown(rows, categories, 'IDR');

		expect(result).toHaveLength(6);
		expect(result.at(-1)).toMatchObject({ label: 'Lainnya', total: 15 });
	});

	test('ignores income rows and other currencies', () => {
		const result = buildCategoryBreakdown(
			[makeRow('a', 10, { type: 'income' }), makeRow('a', 10, { currency: 'USD' })],
			[makeCategory('a', 'Gaji')],
			'IDR'
		);

		expect(result).toEqual([]);
	});

	test('returns an empty list when there are no expenses', () => {
		expect(buildCategoryBreakdown([], [], 'IDR')).toEqual([]);
	});
});
