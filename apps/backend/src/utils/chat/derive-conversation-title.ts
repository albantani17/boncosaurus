const MAX_LENGTH = 60;

export function deriveConversationTitle(text: string): string | null {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (!singleLine) return null;
  return singleLine.length > MAX_LENGTH ? `${singleLine.slice(0, MAX_LENGTH - 1).trimEnd()}…` : singleLine;
}
