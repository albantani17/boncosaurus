import type { AiProviderKind } from '../types/ai.types';

export type ModelListRequest = {
	kind: AiProviderKind;
	baseUrl: string;
	apiKey: string;
	providerId?: string;
};

export type ModelListResult = { ok: true; models: string[] } | { ok: false; message: string };

const ENDPOINT = '/asisten/pengaturan/models';
const FALLBACK_MESSAGE = 'Gagal mengambil daftar model. Coba lagi.';

export async function fetchProviderModels(
	request: ModelListRequest,
	fetcher: typeof fetch = fetch
): Promise<ModelListResult> {
	const body = {
		kind: request.kind,
		baseUrl: request.baseUrl.trim() || null,
		...(request.apiKey.trim() ? { apiKey: request.apiKey.trim() } : {}),
		...(request.providerId ? { providerId: request.providerId } : {})
	};
	try {
		const response = await fetcher(ENDPOINT, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const payload = await response.json().catch(() => null);
		if (!response.ok || !Array.isArray(payload?.models)) {
			return { ok: false, message: typeof payload?.message === 'string' ? payload.message : FALLBACK_MESSAGE };
		}
		return { ok: true, models: payload.models.filter((model: unknown) => typeof model === 'string') };
	} catch {
		return { ok: false, message: FALLBACK_MESSAGE };
	}
}
