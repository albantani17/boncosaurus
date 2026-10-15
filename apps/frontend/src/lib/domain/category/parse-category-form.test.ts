import { describe, expect, test } from 'bun:test';
import { parseCategoryForm, parseCategoryRenameForm } from './parse-category-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

describe('parseCategoryForm', () => {
	test('parses a root category', () => {
		expect(parseCategoryForm(formWith({ name: 'Makanan', type: 'expense', parentId: '' }))).toEqual({
			ok: true,
			value: { name: 'Makanan', type: 'expense' }
		});
	});

	test('keeps the parent of a subcategory', () => {
		expect(parseCategoryForm(formWith({ name: 'Kopi', type: 'expense', parentId: 'p-1' }))).toMatchObject({
			value: { parentId: 'p-1' }
		});
	});

	test('rejects an empty name', () => {
		expect(parseCategoryForm(formWith({ name: '', type: 'expense' }))).toMatchObject({ ok: false });
	});

	test('rejects an unknown type', () => {
		expect(parseCategoryForm(formWith({ name: 'X', type: 'transfer' }))).toMatchObject({ ok: false });
	});
});

describe('parseCategoryRenameForm', () => {
	test('returns the trimmed name', () => {
		expect(parseCategoryRenameForm(formWith({ name: ' Jajan ' }))).toEqual({ ok: true, value: { name: 'Jajan' } });
	});

	test('rejects an empty name', () => {
		expect(parseCategoryRenameForm(formWith({ name: '' }))).toMatchObject({ ok: false });
	});
});
