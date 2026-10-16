import { describe, expect, test } from 'bun:test';
import type { Category } from '../../types/api.types';
import { pickChargeCategory } from './pick-charge-category';

const category = (overrides: Partial<Category>): Category => ({
	id: 'c',
	name: 'Lainnya',
	type: 'expense',
	parentId: null,
	isArchived: false,
	...overrides
});

describe('pickChargeCategory', () => {
	test('finds the default interest category of the right type', () => {
		const categories = [category({ id: 'fee', name: 'Bunga & Biaya' }), category({ id: 'in', name: 'Bunga diterima', type: 'income' })];
		expect(pickChargeCategory(categories, 'expense')?.id).toBe('fee');
		expect(pickChargeCategory(categories, 'income')?.id).toBe('in');
	});

	test('ignores case but skips archived categories', () => {
		expect(pickChargeCategory([category({ name: 'bunga & biaya' })], 'expense')?.id).toBe('c');
		expect(pickChargeCategory([category({ name: 'Bunga & Biaya', isArchived: true })], 'expense')).toBeUndefined();
	});

	test('returns nothing when the workspace has no such category', () => {
		expect(pickChargeCategory([category({})], 'expense')).toBeUndefined();
	});
});
