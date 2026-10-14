import type { FormResult } from '../types/form.types';
import type { ImportCommitPayload } from '../types/import.types';
import { readFormText } from './read-form-text';

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export function parseImportUploadForm(data: FormData): FormResult<FormData> {
	const file = data.get('file');
	if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Pilih file yang akan diimpor.' };
	if (file.size > MAX_IMPORT_FILE_BYTES) return { ok: false, message: 'File terlalu besar. Maksimal 5 MB.' };

	const body = new FormData();
	body.set('file', file, file.name);
	const timeZone = readFormText(data, 'timeZone');
	const offset = readFormText(data, 'utcOffsetMinutes');
	if (timeZone) body.set('timeZone', timeZone);
	if (/^-?\d{1,4}$/.test(offset)) body.set('utcOffsetMinutes', offset);
	return { ok: true, value: body };
}

export function parseImportCommitForm(data: FormData): FormResult<ImportCommitPayload> {
	try {
		const payload = JSON.parse(readFormText(data, 'payload')) as ImportCommitPayload;
		if (!Array.isArray(payload?.rows) || payload.rows.length === 0) {
			return { ok: false, message: 'Pilih minimal satu transaksi untuk diimpor.' };
		}
		return { ok: true, value: payload };
	} catch {
		return { ok: false, message: 'Data impor tidak valid. Unggah ulang filenya.' };
	}
}
