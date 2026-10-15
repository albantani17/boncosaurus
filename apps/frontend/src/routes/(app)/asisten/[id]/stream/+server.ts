import { ApiError } from '#lib/server/api/api-error.ts';
import { backendFor } from '#lib/server/api/backend.ts';
import { describeApiError } from '#lib/domain/error/describe-api-error.ts';
import { isUuid } from '#lib/utils/is-uuid.ts';
import type { RequestHandler } from './$types';

const UNREACHABLE_MESSAGE = 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.';

// The chat transport shows a failed response body as the error, so failures are plain text.
const textError = (message: string, status: number) =>
	new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

// Streams the backend's UI message stream through unchanged so the browser never talks to the backend.
export const POST: RequestHandler = async ({ locals, fetch, params, request }) => {
	if (!locals.accessToken) return textError('Sesi berakhir. Silakan masuk lagi.', 401);
	if (!isUuid(params.id)) return textError(describeApiError('NOT_FOUND'), 404);

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return textError(describeApiError('VALIDATION_ERROR'), 400);

	try {
		const response = await backendFor(fetch, { accessToken: locals.accessToken }).request(
			`/chat/conversations/${params.id}/messages`,
			{ method: 'POST', body, signal: request.signal }
		);
		return new Response(response.body, {
			headers: {
				'content-type': response.headers.get('content-type') ?? 'text/event-stream',
				'cache-control': 'no-cache',
				'x-vercel-ai-ui-message-stream': response.headers.get('x-vercel-ai-ui-message-stream') ?? 'v1',
				'x-accel-buffering': 'no'
			}
		});
	} catch (error) {
		if (error instanceof ApiError) return textError(describeApiError(error.code), error.status);
		return textError(UNREACHABLE_MESSAGE, 502);
	}
};
