export type PushCallResult = { ok: true } | { ok: false; message: string };

const FALLBACK_MESSAGE = 'Gagal menghubungi server. Coba lagi.';

/** Calls one of the app's push endpoints and turns its answer into a result. */
export async function callPushEndpoint(
	path: string,
	method: 'POST' | 'DELETE',
	body?: unknown,
	fetcher: typeof fetch = fetch
): Promise<PushCallResult> {
	try {
		const response = await fetcher(path, {
			method,
			headers: { 'content-type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (response.ok) return { ok: true };
		const payload = await response.json().catch(() => null);
		return { ok: false, message: typeof payload?.message === 'string' ? payload.message : FALLBACK_MESSAGE };
	} catch {
		return { ok: false, message: FALLBACK_MESSAGE };
	}
}
