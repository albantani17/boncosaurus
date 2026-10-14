import type { FormResult } from '../types/form.types';
import { isUuid } from './is-uuid';
import { readFormText } from './read-form-text';

export type DraftReference = { messageId: string; toolCallId: string };

export function parseDraftReference(data: FormData): FormResult<DraftReference> {
	const messageId = readFormText(data, 'messageId');
	const toolCallId = readFormText(data, 'toolCallId');
	if (!isUuid(messageId) || !toolCallId) return { ok: false, message: 'Draf tidak valid. Muat ulang halaman.' };
	return { ok: true, value: { messageId, toolCallId } };
}
