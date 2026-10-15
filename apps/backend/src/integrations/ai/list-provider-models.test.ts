import { describe, expect, test } from 'bun:test';
import { listProviderModels } from './list-provider-models';

const respond = (body: unknown, status = 200) => {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string> });
    return Response.json(body, { status });
  };
  return { fetcher, calls };
};

describe('listProviderModels', () => {
  test('lists Anthropic models with the api key header', async () => {
    const { fetcher, calls } = respond({ data: [{ id: 'claude-sonnet-5-5' }, { id: 'claude-haiku-5-5' }] });

    const models = await listProviderModels({ kind: 'anthropic', baseUrl: null, apiKey: 'sk-ant' }, fetcher);

    expect(models).toEqual(['claude-haiku-5-5', 'claude-sonnet-5-5']);
    expect(calls[0]?.url).toBe('https://api.anthropic.com/v1/models?limit=1000');
    expect(calls[0]?.headers).toMatchObject({ 'x-api-key': 'sk-ant', 'anthropic-version': '2023-06-01' });
  });

  test('keeps only Google models that support generateContent and strips the prefix', async () => {
    const { fetcher, calls } = respond({
      models: [
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
        { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] }
      ]
    });

    const models = await listProviderModels({ kind: 'google', baseUrl: null, apiKey: 'g-key' }, fetcher);

    expect(models).toEqual(['gemini-3.8-flash']);
    expect(calls[0]?.url).toBe('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000');
    expect(calls[0]?.headers).toEqual({ 'x-goog-api-key': 'g-key' });
  });

  test('uses the base URL of an OpenAI-compatible provider without auth when there is no key', async () => {
    const { fetcher, calls } = respond({ data: [{ id: 'qwen3' }, { id: 'llama3.1' }, { id: 'qwen3' }] });

    const models = await listProviderModels(
      { kind: 'openai_compatible', baseUrl: 'http://localhost:11434/v1', apiKey: null },
      fetcher
    );

    expect(models).toEqual(['llama3.1', 'qwen3']);
    expect(calls[0]).toEqual({ url: 'http://localhost:11434/v1/models', headers: {} });
  });

  test('sends a bearer token to OpenAI', async () => {
    const { fetcher, calls } = respond({ data: [] });

    await listProviderModels({ kind: 'openai', baseUrl: null, apiKey: 'sk-oa' }, fetcher);

    expect(calls[0]).toEqual({ url: 'https://api.openai.com/v1/models', headers: { authorization: 'Bearer sk-oa' } });
  });

  test("throws the provider's error message", async () => {
    const { fetcher } = respond({ error: { message: 'API key not valid' } }, 400);
    expect(listProviderModels({ kind: 'google', baseUrl: null, apiKey: 'bad' }, fetcher)).rejects.toThrow(
      'API key not valid'
    );
  });

  test('falls back to the status code when the error has no message', async () => {
    const { fetcher } = respond(null, 404);
    expect(
      listProviderModels({ kind: 'openai_compatible', baseUrl: 'http://x/v1', apiKey: null }, fetcher)
    ).rejects.toThrow('status 404');
  });
});
