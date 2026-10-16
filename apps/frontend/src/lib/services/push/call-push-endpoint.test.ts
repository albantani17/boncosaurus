import { describe, expect, test } from 'bun:test';
import { callPushEndpoint } from './call-push-endpoint';

const respond = (status: number, body?: unknown) =>
	(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('callPushEndpoint', () => {
	test('sends JSON and reports success', async () => {
		const requests: RequestInit[] = [];
		const fetcher = (async (_path: string, init: RequestInit) => {
			requests.push(init);
			return new Response('{}', { status: 200 });
		}) as unknown as typeof fetch;

		expect(await callPushEndpoint('/profil/notifikasi', 'POST', { endpoint: 'x' }, fetcher)).toEqual({ ok: true });
		expect(requests[0]).toMatchObject({ method: 'POST', body: '{"endpoint":"x"}' });
	});

	test('sends no body when there is none', async () => {
		const requests: RequestInit[] = [];
		const fetcher = (async (_path: string, init: RequestInit) => {
			requests.push(init);
			return new Response('{}');
		}) as unknown as typeof fetch;

		await callPushEndpoint('/profil/notifikasi/tes', 'POST', undefined, fetcher);

		expect(requests[0]?.body).toBeUndefined();
	});

	test('passes on the message of a failed call', async () => {
		expect(await callPushEndpoint('/x', 'POST', {}, respond(503, { message: 'Belum aktif' }))).toEqual({
			ok: false,
			message: 'Belum aktif'
		});
	});

	test('falls back to a generic message', async () => {
		expect(await callPushEndpoint('/x', 'POST', {}, respond(500))).toMatchObject({ ok: false });
		const offline = (async () => {
			throw new TypeError('offline');
		}) as unknown as typeof fetch;
		expect(await callPushEndpoint('/x', 'DELETE', {}, offline)).toMatchObject({ ok: false });
	});
});
