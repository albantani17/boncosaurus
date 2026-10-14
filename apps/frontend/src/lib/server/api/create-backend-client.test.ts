import { describe, expect, test } from 'bun:test';
import { createBackendClient } from './create-backend-client';

function setup() {
	const calls: RequestInit[] = [];
	const fetch = (async (_url: string, init: RequestInit) => {
		calls.push(init);
		return new Response('{}');
	}) as unknown as typeof globalThis.fetch;
	return { calls, client: createBackendClient({ fetch, baseUrl: 'http://api', accessToken: 'tok' }) };
}

describe('createBackendClient.request', () => {
	test('sends objects as JSON', async () => {
		const { calls, client } = setup();
		await client.request('/x', { method: 'POST', body: { a: 1 } });
		expect(calls[0]!.body).toBe('{"a":1}');
		expect((calls[0]!.headers as Record<string, string>)['content-type']).toBe('application/json');
	});

	test('passes FormData through without a content type so the boundary is set automatically', async () => {
		const { calls, client } = setup();
		const body = new FormData();
		body.set('a', '1');
		await client.request('/x', { method: 'POST', body });
		expect(calls[0]!.body).toBe(body);
		expect(calls[0]!.headers as Record<string, string>).not.toHaveProperty('content-type');
		expect((calls[0]!.headers as Record<string, string>).authorization).toBe('Bearer tok');
	});
});
