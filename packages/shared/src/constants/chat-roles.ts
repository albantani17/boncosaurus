export const CHAT_ROLES = ['user', 'assistant'] as const;

export type ChatRole = (typeof CHAT_ROLES)[number];
