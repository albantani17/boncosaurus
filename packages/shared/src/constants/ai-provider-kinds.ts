export const AI_PROVIDER_KINDS = ['anthropic', 'openai', 'google', 'openai_compatible'] as const;

export type AiProviderKind = (typeof AI_PROVIDER_KINDS)[number];
