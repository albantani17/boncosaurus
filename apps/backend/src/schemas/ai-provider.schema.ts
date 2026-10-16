import {
  AI_PROVIDER_KINDS,
  type Assert,
  type CreateAiProviderBody,
  type IsMutuallyAssignable,
  type UpdateAiProviderBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { unionEnum } from './union-enum.schema';

const kind = unionEnum(AI_PROVIDER_KINDS);
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

type _CreateAiProviderContract = Assert<
  IsMutuallyAssignable<Static<typeof createAiProviderBody>, CreateAiProviderBody>
>;
type _UpdateAiProviderContract = Assert<
  IsMutuallyAssignable<Static<typeof updateAiProviderBody>, UpdateAiProviderBody>
>;
