import { describe, expect, test } from 'bun:test';
import { parseAiProviderForm } from './parse-ai-provider-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const anthropic = { name: 'Claude', kind: 'anthropic', model: 'claude-sonnet-5-5' };

describe('parseAiProviderForm', () => {
	test('parses a hosted provider with an api key', () => {
		expect(parseAiProviderForm(formWith({ ...anthropic, baseUrl: '', apiKey: ' sk-1 ' }))).toEqual({
			ok: true,
			value: { name: 'Claude', kind: 'anthropic', model: 'claude-sonnet-5-5', baseUrl: null, apiKey: 'sk-1' }
		});
	});

	test('omits an empty api key so the stored key is kept', () => {
		const result = parseAiProviderForm(formWith({ ...anthropic, apiKey: '' }));
		expect(result.ok && 'apiKey' in result.value).toBe(false);
	});

	test('asks to clear the key only when no new key is given', () => {
		expect(parseAiProviderForm(formWith({ ...anthropic, clearApiKey: 'on' }))).toMatchObject({
			value: { clearApiKey: true }
		});
		const replaced = parseAiProviderForm(formWith({ ...anthropic, clearApiKey: 'on', apiKey: 'sk-2' }));
		expect(replaced.ok && 'clearApiKey' in replaced.value).toBe(false);
	});

	test('requires a base URL for OpenAI-compatible providers', () => {
		expect(parseAiProviderForm(formWith({ name: 'Ollama', kind: 'openai_compatible', model: 'llama3.1' }))).toEqual({
			ok: false,
			message: 'Base URL wajib diisi untuk provider OpenAI-compatible.'
		});
	});

	test('rejects missing name, kind or model', () => {
		expect(parseAiProviderForm(formWith({ ...anthropic, name: '' }))).toMatchObject({ ok: false });
		expect(parseAiProviderForm(formWith({ ...anthropic, kind: 'other' }))).toMatchObject({ ok: false });
		expect(parseAiProviderForm(formWith({ ...anthropic, model: ' ' }))).toMatchObject({ ok: false });
	});
});
