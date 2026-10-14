import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogle } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import type { AiProviderKind } from '../types/ai.types';

export type LanguageModelSettings = {
  kind: AiProviderKind;
  model: string;
  baseUrl: string | null;
  apiKey: string | null;
};

const OPENAI_COMPATIBLE_NAME = 'openai-compatible';

export function createLanguageModel({ kind, model, baseUrl, apiKey }: LanguageModelSettings): LanguageModel {
  const baseURL = baseUrl ?? undefined;
  // An empty key keeps the SDK from falling back to provider env vars on the server.
  const key = apiKey ?? '';

  switch (kind) {
    case 'anthropic':
      return createAnthropic({ apiKey: key, baseURL })(model);
    case 'openai':
      return createOpenAI({ apiKey: key, baseURL })(model);
    case 'google':
      return createGoogle({ apiKey: key, baseURL })(model);
    case 'openai_compatible':
      if (!baseURL) throw new Error('An OpenAI-compatible provider needs a base URL');
      return createOpenAICompatible({ name: OPENAI_COMPATIBLE_NAME, baseURL, apiKey: apiKey ?? undefined })(model);
  }
}
