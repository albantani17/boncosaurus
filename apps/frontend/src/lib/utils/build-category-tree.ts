import type { Category, CategoryType } from '../types/api.types';

export type CategoryNode = { category: Category; children: Category[] };

const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'id');

export function buildCategoryTree(categories: Category[], type: CategoryType): CategoryNode[] {
	const ofType = categories.filter((category) => category.type === type);
	const ids = new Set(ofType.map((category) => category.id));
	const isRoot = (category: Category) => !category.parentId || !ids.has(category.parentId);

	return ofType
		.filter(isRoot)
		.sort(byName)
		.map((category) => ({
			category,
			children: ofType.filter((child) => child.parentId === category.id).sort(byName)
		}));
}
