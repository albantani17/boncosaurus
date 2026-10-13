const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export function parseBearerToken(header: string | undefined): string | null {
  return header?.match(BEARER_PATTERN)?.[1] ?? null;
}
