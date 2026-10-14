import { t } from 'elysia';

const kind = t.Union([
  t.Literal('anthropic'),
  t.Literal('openai'),
  t.Literal('google'),
  t.Literal('openai_compatible')
]);
const name = t.String({ minLength: 1, maxLength: 100 });
const model = t.String({ minLength: 1, maxLength: 200 });
const baseUrl = t.Union([t.String({ maxLength: 500 }), t.Null()]);
const apiKey = t.Union([t.String({ maxLength: 1000 }), t.Null()]);

export const createAiProviderBody = t.Object({
  name,
  kind,
  model,
  baseUrl: t.Optional(baseUrl),
  apiKey: t.Optional(apiKey)
});

export const updateAiProviderBody = t.Object({
  name: t.Optional(name),
  kind: t.Optional(kind),
  model: t.Optional(model),
  baseUrl: t.Optional(baseUrl),
  apiKey: t.Optional(apiKey),
  clearApiKey: t.Optional(t.Boolean())
});

export const listModelsBody = t.Object({
  kind,
  baseUrl: t.Optional(baseUrl),
  apiKey: t.Optional(apiKey),
  providerId: t.Optional(t.String({ format: 'uuid' }))
});
