import { json } from '@sveltejs/kit';
import { ApiError } from '@boncosaurus/shared';
import { describeApiError } from '../../domain/error/describe-api-error';
import { backendFor } from './backend';

const UNREACHABLE_MESSAGE = 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.';
const SESSION_EXPIRED = 'Sesi berakhir. Silakan masuk lagi.';

type Init = { method: string; body?: unknown };

/** Calls the backend for a browser `fetch` and answers with JSON (`{ message }` on failure). */
export async function forwardJson(
	{ locals, fetch }: { locals: App.Locals; fetch: typeof globalThis.fetch },
	path: string,
	init: Init
): Promise<Response> {
	if (!locals.accessToken) return json({ message: SESSION_EXPIRED }, { status: 401 });
	try {
		const response = await backendFor(fetch, { accessToken: locals.accessToken }).request(path, init);
		const text = await response.text();
		return json(text ? JSON.parse(text) : {});
	} catch (error) {
		if (!(error instanceof ApiError)) return json({ message: UNREACHABLE_MESSAGE }, { status: 502 });
		return json({ message: describeApiError(error.code) }, { status: error.status });
	}
}
