import { describe, expect, test } from 'bun:test';
import { fetchProviderModels } from './fetch-provider-models';

const fakeFetch = (body: unknown, status = 200) => {
	const sent: unknown[] = [];
	const fetcher = (async (_url: string, init: RequestInit) => {
		sent.push(JSON.parse(String(init.body)));
		return Response.json(body, { status });
	}) as typeof fetch;
	return { fetcher, sent };
};

describe('fetchProviderModels', () => {
	test('sends trimmed fields and returns the models', async () => {
		const { fetcher, sent } = fakeFetch({ models: ['gemini-3.8-flash'] });

		const result = await fetchProviderModels({ kind: 'google', baseUrl: ' ', apiKey: ' g-key ' }, fetcher);

		expect(result).toEqual({ ok: true, models: ['gemini-3.8-flash'] });
		expect(sent[0]).toEqual({ kind: 'google', baseUrl: null, apiKey: 'g-key' });
	});

	test('sends the provider id instead of an empty key', async () => {
		const { fetcher, sent } = fakeFetch({ models: [] });

		await fetchProviderModels({ kind: 'anthropic', baseUrl: '', apiKey: '', providerId: 'p1' }, fetcher);

		expect(sent[0]).toEqual({ kind: 'anthropic', baseUrl: null, providerId: 'p1' });
	});

	test('returns the server message on failure', async () => {
		const { fetcher } = fakeFetch({ message: 'Gagal mengambil model: API key not valid' }, 502);
		expect(await fetchProviderModels({ kind: 'google', baseUrl: '', apiKey: 'x' }, fetcher)).toEqual({
			ok: false,
			message: 'Gagal mengambil model: API key not valid'
		});
	});

	test('returns a fallback message when the response is not JSON', async () => {
		const fetcher = (async () => new Response('Bad Gateway', { status: 502 })) as unknown as typeof fetch;
		expect(await fetchProviderModels({ kind: 'openai', baseUrl: '', apiKey: 'k' }, fetcher)).toEqual({
			ok: false,
			message: 'Gagal mengambil daftar model. Coba lagi.'
		});
	});

	test('drops entries that are not model names', async () => {
		const { fetcher } = fakeFetch({ models: ['qwen3', 42, null] });
		expect(await fetchProviderModels({ kind: 'openai', baseUrl: '', apiKey: 'k' }, fetcher)).toEqual({
			ok: true,
			models: ['qwen3']
		});
	});

	test('returns a fallback message when the request throws', async () => {
		const fetcher = (async () => {
			throw new Error('offline');
		}) as unknown as typeof fetch;
		expect(await fetchProviderModels({ kind: 'openai', baseUrl: '', apiKey: 'k' }, fetcher)).toMatchObject({ ok: false });
	});
});
