// Returns the URL without a trailing slash, or null when it is not an absolute http(s) URL.
export function normalizeBaseUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  return url.toString().replace(/\/+$/, '');
}
