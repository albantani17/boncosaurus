export const MAX_USER_MESSAGE_LENGTH = 4000;

type TextPart = { type: 'text'; text: string };

// Keeps only the text the user typed; tool, file and data parts are never accepted from the client.
export function toUserTextParts(parts: unknown): TextPart[] | null {
  if (!Array.isArray(parts)) return null;
  const text = parts
    .filter(
      (part): part is TextPart =>
        typeof part === 'object' && part !== null && part.type === 'text' && typeof part.text === 'string'
    )
    .map((part) => part.text)
    .join('\n')
    .trim();
  if (!text || text.length > MAX_USER_MESSAGE_LENGTH) return null;
  return [{ type: 'text', text }];
}
