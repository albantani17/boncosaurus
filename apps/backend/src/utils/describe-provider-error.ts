const MAX_LENGTH = 300;
const FALLBACK = 'The AI provider did not respond';

export function describeProviderError(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message) return FALLBACK;
  return message.length > MAX_LENGTH ? `${message.slice(0, MAX_LENGTH)}…` : message;
}
