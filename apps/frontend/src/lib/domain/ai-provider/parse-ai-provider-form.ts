import {
	AI_PROVIDER_KINDS,
	type AiProviderKind,
	type CreateAiProviderBody,
	type UpdateAiProviderBody
} from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { readFormText } from '../../utils/read-form-text';

export type AiProviderInput = CreateAiProviderBody & Pick<UpdateAiProviderBody, 'clearApiKey'>;

// An empty api key means "keep the stored key" on update and "no key" on create.
export function parseAiProviderForm(data: FormData): FormResult<AiProviderInput> {
	const name = readFormText(data, 'name');
	const kind = readFormText(data, 'kind') as AiProviderKind;
	const model = readFormText(data, 'model');
	const baseUrl = readFormText(data, 'baseUrl');
	const apiKey = readFormText(data, 'apiKey');
	const clearApiKey = data.get('clearApiKey') === 'on';

	if (!name) return { ok: false, message: 'Nama wajib diisi.' };
	if (!AI_PROVIDER_KINDS.includes(kind)) return { ok: false, message: 'Pilih jenis provider.' };
	if (!model) return { ok: false, message: 'Model wajib diisi.' };
	if (kind === 'openai_compatible' && !baseUrl) {
		return { ok: false, message: 'Base URL wajib diisi untuk provider OpenAI-compatible.' };
	}

	return {
		ok: true,
		value: {
			name,
			kind,
			model,
			baseUrl: baseUrl || null,
			...(apiKey ? { apiKey } : {}),
			...(clearApiKey && !apiKey ? { clearApiKey: true } : {})
		}
	};
}
