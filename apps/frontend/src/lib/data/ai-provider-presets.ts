import type { AiProviderKind } from '../types/ai.types';

export const AI_PROVIDER_KIND_LABELS: Record<AiProviderKind, string> = {
	anthropic: 'Anthropic (Claude)',
	openai: 'OpenAI (GPT)',
	google: 'Google (Gemini)',
	openai_compatible: 'OpenAI-compatible (Ollama, LM Studio, OpenRouter, …)'
};

export const AI_MODEL_SUGGESTIONS: Record<AiProviderKind, string[]> = {
	anthropic: ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'],
	openai: ['gpt-5', 'gpt-5-mini'],
	google: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview'],
	openai_compatible: ['llama3.1', 'qwen3', 'mistral-small']
};

export type BaseUrlPreset = { label: string; baseUrl: string; needsKey: boolean };

export const OPENAI_COMPATIBLE_PRESETS: BaseUrlPreset[] = [
	{ label: 'Ollama (lokal)', baseUrl: 'http://localhost:11434/v1', needsKey: false },
	{ label: 'LM Studio (lokal)', baseUrl: 'http://localhost:1234/v1', needsKey: false },
	{ label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', needsKey: true },
	{ label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', needsKey: true },
	{ label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', needsKey: true }
];
