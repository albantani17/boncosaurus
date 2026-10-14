import { readRecordId } from '../../utils/read-record-id';
import { formFailure } from './run-backend-action';

export function requireRecordId(data: FormData) {
	const id = readRecordId(data);
	return id ? { ok: true as const, id } : { ok: false as const, failure: formFailure('Data tidak valid. Muat ulang halaman.') };
}
