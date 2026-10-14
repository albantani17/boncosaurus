import type { CategoryType } from '../types/api.types';
import type { FormResult } from '../types/form.types';
import { readFormText } from './read-form-text';

export type CategoryInput = { name: string; type: CategoryType; parentId?: string };

const CATEGORY_TYPES: CategoryType[] = ['income', 'expense'];

export function parseCategoryForm(data: FormData): FormResult<CategoryInput> {
	const name = readFormText(data, 'name');
	const type = readFormText(data, 'type') as CategoryType;
	const parentId = readFormText(data, 'parentId');

	if (!name) return { ok: false, message: 'Nama kategori wajib diisi.' };
	if (!CATEGORY_TYPES.includes(type)) return { ok: false, message: 'Pilih jenis kategori.' };
	return { ok: true, value: { name, type, ...(parentId ? { parentId } : {}) } };
}

export function parseCategoryRenameForm(data: FormData): FormResult<{ name: string }> {
	const name = readFormText(data, 'name');
	if (!name) return { ok: false, message: 'Nama kategori wajib diisi.' };
	return { ok: true, value: { name } };
}
