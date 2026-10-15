import { json } from '@sveltejs/kit';
import { ApiError } from '#lib/server/api/api-error.ts';
import { backendFor } from '#lib/server/api/backend.ts';
import { describeApiError } from '#lib/domain/error/describe-api-error.ts';
import type { RequestHandler } from './$types';

const UNREACHABLE_MESSAGE = 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.';

export const POST: RequestHandler = async ({ locals, fetch, request }) => {
	if (!locals.accessToken) return json({ message: 'Sesi berakhir. Silakan masuk lagi.' }, { status: 401 });

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return json({ message: describeApiError('VALIDATION_ERROR') }, { status: 400 });

	try {
		const response = await backendFor(fetch, { accessToken: locals.accessToken }).request('/ai/providers/models', {
			method: 'POST',
			body
		});
		return json(await response.json());
	} catch (error) {
		if (!(error instanceof ApiError)) return json({ message: UNREACHABLE_MESSAGE }, { status: 502 });
		// The provider's own reason (bad key, wrong URL) is more useful than a generic message here.
		const message = error.code === 'AI_PROVIDER_FAILED' ? `Gagal mengambil model: ${error.message}` : describeApiError(error.code);
		return json({ message }, { status: error.status });
	}
};
