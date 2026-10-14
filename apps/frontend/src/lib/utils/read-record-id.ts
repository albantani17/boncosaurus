import { isUuid } from './is-uuid';
import { readFormText } from './read-form-text';

export function readRecordId(data: FormData): string | null {
	const id = readFormText(data, 'id');
	return isUuid(id) ? id : null;
}
