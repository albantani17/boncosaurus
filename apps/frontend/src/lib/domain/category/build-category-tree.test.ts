import { describe, expect, test } from 'bun:test';
import type { Category } from '../../types/api.types';
import { buildCategoryTree } from './build-category-tree';

const category = (id: string, name: string, overrides: Partial<Category> = {}): Category => ({
	id,
	name,
	type: 'expense',
	parentId: null,
	isArchived: false,
	...overrides
});

describe('buildCategoryTree', () => {
	test('nests subcategories under their parent, both sorted by name', () => {
		const tree = buildCategoryTree(
			[
				category('m', 'Makanan'),
				category('t', 'Transport'),
				category('k', 'Kopi', { parentId: 'm' }),
				category('b', 'Bakso', { parentId: 'm' })
			],
			'expense'
		);

		expect(tree.map((node) => [node.category.name, node.children.map((child) => child.name)])).toEqual([
			['Makanan', ['Bakso', 'Kopi']],
			['Transport', []]
		]);
	});

	test('only includes categories of the requested type', () => {
		const tree = buildCategoryTree([category('g', 'Gaji', { type: 'income' }), category('m', 'Makanan')], 'income');

		expect(tree.map((node) => node.category.name)).toEqual(['Gaji']);
	});

	test('treats a child whose parent is missing as a root', () => {
		const tree = buildCategoryTree([category('k', 'Kopi', { parentId: 'gone' })], 'expense');

		expect(tree).toHaveLength(1);
	});

	test('returns an empty tree without categories', () => {
		expect(buildCategoryTree([], 'expense')).toEqual([]);
	});
});
