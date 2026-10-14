import type { LanguageModelSettings } from './create-language-model';

export type ModelListSettings = Omit<LanguageModelSettings, 'model'>;
type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const DEFAULT_BASE_URLS = {
  anthropic: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta'
} as const;
const ANTHROPIC_VERSION = '2023-06-01';
const TIMEOUT_MS = 15_000;

type IdList = { data?: Array<{ id?: unknown }> };
type GoogleList = { models?: Array<{ name?: unknown; supportedGenerationMethods?: unknown }> };

function buildRequest({ kind, baseUrl, apiKey }: ModelListSettings): { url: string; headers: Record<string, string> } {
  switch (kind) {
    case 'anthropic':
      return {
        url: `${baseUrl ?? DEFAULT_BASE_URLS.anthropic}/models?limit=1000`,
        headers: { 'x-api-key': apiKey ?? '', 'anthropic-version': ANTHROPIC_VERSION }
      };
    case 'google':
      return {
        url: `${baseUrl ?? DEFAULT_BASE_URLS.google}/models?pageSize=1000`,
        headers: { 'x-goog-api-key': apiKey ?? '' }
      };
    case 'openai':
    case 'openai_compatible':
      if (kind === 'openai_compatible' && !baseUrl) throw new Error('An OpenAI-compatible provider needs a base URL');
      return {
        url: `${baseUrl ?? DEFAULT_BASE_URLS.openai}/models`,
        headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {}
      };
  }
}

// Google lists embedding and other models too; keep the ones that can chat.
function readGoogleModels(body: GoogleList): string[] {
  return (body.models ?? [])
    .filter(
      (model) =>
        Array.isArray(model.supportedGenerationMethods) &&
        model.supportedGenerationMethods.includes('generateContent')
    )
    .map((model) => String(model.name ?? '').replace(/^models\//, ''))
    .filter(Boolean);
}

const readIdList = (body: IdList): string[] =>
  (body.data ?? []).map((model) => (typeof model.id === 'string' ? model.id : '')).filter(Boolean);

async function describeFailure(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: unknown } | string } | null;
  const detail = typeof body?.error === 'string' ? body.error : body?.error?.message;
  return typeof detail === 'string' && detail ? detail : `Request failed with status ${response.status}`;
}

export async function listProviderModels(settings: ModelListSettings, fetcher: FetchLike = fetch): Promise<string[]> {
  const { url, headers } = buildRequest(settings);
  const response = await fetcher(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(await describeFailure(response));

  const body = await response.json();
  const ids = settings.kind === 'google' ? readGoogleModels(body) : readIdList(body);
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}
