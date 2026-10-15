import { CATEGORY_TYPES, type CategoryType, type CreateCategoryBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { readFormText } from '../../utils/read-form-text';

export function parseCategoryForm(data: FormData): FormResult<CreateCategoryBody> {
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
