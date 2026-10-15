import { describe, expect, test } from 'bun:test';
import { createLanguageModel } from './create-language-model';

const modelInfo = (model: ReturnType<typeof createLanguageModel>) => {
  if (typeof model === 'string') throw new Error('expected a model instance');
  return { provider: model.provider, modelId: model.modelId };
};

describe('createLanguageModel', () => {
  test('builds an Anthropic model', () => {
    const model = createLanguageModel({ kind: 'anthropic', model: 'claude-sonnet-5-5', baseUrl: null, apiKey: 'k' });
    expect(modelInfo(model)).toEqual({ provider: 'anthropic.messages', modelId: 'claude-sonnet-5-5' });
  });

  test('builds an OpenAI model', () => {
    const model = createLanguageModel({ kind: 'openai', model: 'gpt-5', baseUrl: null, apiKey: 'k' });
    expect(modelInfo(model).modelId).toBe('gpt-5');
    expect(modelInfo(model).provider).toStartWith('openai');
  });

  test('builds a Google model', () => {
    const model = createLanguageModel({ kind: 'google', model: 'gemini-3-flash', baseUrl: null, apiKey: 'k' });
    expect(modelInfo(model).modelId).toBe('gemini-3-flash');
    expect(modelInfo(model).provider).toStartWith('google');
  });

  test('builds an OpenAI-compatible model without an api key', () => {
    const model = createLanguageModel({
      kind: 'openai_compatible',
      model: 'llama3.1',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: null
    });
    expect(modelInfo(model)).toEqual({ provider: 'openai-compatible.chat', modelId: 'llama3.1' });
  });

  test('requires a base URL for an OpenAI-compatible model', () => {
    expect(() =>
      createLanguageModel({ kind: 'openai_compatible', model: 'llama3.1', baseUrl: null, apiKey: null })
    ).toThrow('base URL');
  });
});
