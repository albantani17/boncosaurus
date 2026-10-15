import { describe, expect, test } from 'bun:test';
import { ApiError } from '@boncosaurus/shared';
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

describe('createBackendClient errors', () => {
	const failingClient = (response: Response) =>
		createBackendClient({ fetch: (async () => response) as unknown as typeof fetch, baseUrl: 'http://api' });

	test('throws an ApiError with the code and message from the backend body', async () => {
		const body = JSON.stringify({ error: { code: 'ACCOUNT_NAME_TAKEN', message: 'Name taken' } });
		const error = await failingClient(new Response(body, { status: 409 })).request('/x').catch((caught) => caught);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 409, code: 'ACCOUNT_NAME_TAKEN', message: 'Name taken' });
	});

	test('throws REQUEST_FAILED when the body is not JSON', async () => {
		const error = await failingClient(new Response('Bad Gateway', { status: 502 })).request('/x').catch((caught) => caught);
		expect(error).toMatchObject({ status: 502, code: 'REQUEST_FAILED' });
	});
});

describe('createBackendClient.send', () => {
	test('returns the parsed JSON body', async () => {
		const fetch = (async () => new Response('{"id":"1"}')) as unknown as typeof globalThis.fetch;
		const client = createBackendClient({ fetch, baseUrl: 'http://api' });
		expect(await client.send<{ id: string }>('/x', { method: 'POST', body: {} })).toEqual({ id: '1' });
	});
});
