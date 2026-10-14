import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError
} from '../errors/app-error';
import type { AiProviderRepository } from '../repositories/ai-provider.repository';
import type { WorkspaceRepository } from '../repositories/workspace.repository';
import type {
  AiProviderKind,
  AiProviderPatch,
  AiProviderRecord,
  PublicAiProvider
} from '../types/ai.types';
import type { LanguageModelSettings } from '../utils/create-language-model';
import { describeProviderError } from '../utils/describe-provider-error';
import type { ModelListSettings } from '../utils/list-provider-models';
import { isUniqueViolation } from '../utils/is-unique-violation';
import { maskSecret } from '../utils/mask-secret';
import { normalizeBaseUrl } from '../utils/normalize-base-url';
import type { SecretKey } from '../utils/secret-box';

export type ActorContext = { userId: string; workspaceId: string };

export type CreateAiProviderInput = {
  name: string;
  kind: AiProviderKind;
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
};

export type UpdateAiProviderInput = Partial<CreateAiProviderInput> & { clearApiKey?: boolean };

export type ListModelsInput = {
  kind: AiProviderKind;
  baseUrl?: string | null;
  apiKey?: string | null;
  // Reuse this saved provider's key when no key is typed (editing without re-entering it).
  providerId?: string;
};

export type ResolvedProvider = { providerId: string; settings: LanguageModelSettings };

type Dependencies = {
  providers: AiProviderRepository;
  workspaces: Pick<WorkspaceRepository, 'findRole'>;
  secretKey: SecretKey | null;
  encryptSecret: (key: SecretKey, plaintext: string) => Promise<string>;
  decryptSecret: (key: SecretKey, sealed: string) => Promise<string>;
  probeModel: (settings: LanguageModelSettings) => Promise<void>;
  fetchModels: (settings: ModelListSettings) => Promise<string[]>;
};

const MANAGER_ROLES = new Set(['owner', 'admin']);

const toPublic = ({ apiKeyEncrypted, ...provider }: AiProviderRecord): PublicAiProvider => ({
  ...provider,
  hasApiKey: apiKeyEncrypted !== null
});

export function createAiProviderService(deps: Dependencies) {
  const { providers, workspaces } = deps;

  function requireSecretKey(): SecretKey {
    if (!deps.secretKey) {
      throw new ServiceUnavailableError('AI_NOT_CONFIGURED', 'Set AI_SECRET_KEY to enable AI features');
    }
    return deps.secretKey;
  }

  async function assertManager({ userId, workspaceId }: ActorContext) {
    const role = await workspaces.findRole(userId, workspaceId);
    if (!role || !MANAGER_ROLES.has(role)) {
      throw new ForbiddenError('FORBIDDEN_ROLE', 'Only workspace owners and admins can manage AI providers');
    }
  }

  async function requireProvider(workspaceId: string, id: string) {
    const provider = await providers.findById(workspaceId, id);
    if (!provider) throw new NotFoundError('AI provider');
    return provider;
  }

  function resolveBaseUrl(kind: AiProviderKind, baseUrl: string | null | undefined): string | null {
    const trimmed = baseUrl?.trim();
    if (!trimmed) {
      if (kind === 'openai_compatible') {
        throw new BadRequestError('BASE_URL_REQUIRED', 'An OpenAI-compatible provider needs a base URL');
      }
      return null;
    }
    const normalized = normalizeBaseUrl(trimmed);
    if (!normalized) throw new BadRequestError('INVALID_BASE_URL', 'Base URL must be an http(s) URL');
    return normalized;
  }

  async function sealApiKey(apiKey: string) {
    return {
      apiKeyEncrypted: await deps.encryptSecret(requireSecretKey(), apiKey),
      apiKeyHint: maskSecret(apiKey)
    };
  }

  async function toSettings(provider: AiProviderRecord): Promise<LanguageModelSettings> {
    const apiKey = provider.apiKeyEncrypted
      ? await deps.decryptSecret(requireSecretKey(), provider.apiKeyEncrypted)
      : null;
    return { kind: provider.kind, model: provider.model, baseUrl: provider.baseUrl, apiKey };
  }

  async function runUniqueNameWrite<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('AI_PROVIDER_NAME_TAKEN', 'An AI provider with this name already exists');
      }
      throw error;
    }
  }

  return {
    async listProviders(workspaceId: string): Promise<PublicAiProvider[]> {
      requireSecretKey();
      return (await providers.list(workspaceId)).map(toPublic);
    },

    async createProvider(actor: ActorContext, input: CreateAiProviderInput): Promise<PublicAiProvider> {
      requireSecretKey();
      await assertManager(actor);
      const baseUrl = resolveBaseUrl(input.kind, input.baseUrl);
      const apiKey = input.apiKey?.trim();
      const sealed = apiKey ? await sealApiKey(apiKey) : {};
      const isFirst = !(await providers.findDefault(actor.workspaceId));

      const provider = await runUniqueNameWrite(() =>
        providers.insert({
          workspaceId: actor.workspaceId,
          name: input.name.trim(),
          kind: input.kind,
          model: input.model.trim(),
          baseUrl,
          isDefault: isFirst,
          ...sealed
        })
      );
      return toPublic(provider);
    },

    async updateProvider(
      actor: ActorContext,
      id: string,
      input: UpdateAiProviderInput
    ): Promise<PublicAiProvider> {
      requireSecretKey();
      await assertManager(actor);
      const current = await requireProvider(actor.workspaceId, id);
      const kind = input.kind ?? current.kind;
      const baseUrlChanged = input.baseUrl !== undefined || input.kind !== undefined;

      const patch: AiProviderPatch = {
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.model === undefined ? {} : { model: input.model.trim() }),
        ...(input.kind === undefined ? {} : { kind }),
        ...(baseUrlChanged
          ? { baseUrl: resolveBaseUrl(kind, input.baseUrl === undefined ? current.baseUrl : input.baseUrl) }
          : {})
      };

      const apiKey = input.apiKey?.trim();
      if (apiKey) Object.assign(patch, await sealApiKey(apiKey));
      else if (input.clearApiKey) Object.assign(patch, { apiKeyEncrypted: null, apiKeyHint: null });

      const updated = await runUniqueNameWrite(() => providers.update(actor.workspaceId, id, patch));
      if (!updated) throw new NotFoundError('AI provider');
      return toPublic(updated);
    },

    async deleteProvider(actor: ActorContext, id: string): Promise<void> {
      requireSecretKey();
      await assertManager(actor);
      const provider = await requireProvider(actor.workspaceId, id);
      await providers.delete(actor.workspaceId, id);

      if (provider.isDefault) {
        const [next] = await providers.list(actor.workspaceId);
        if (next) await providers.setDefault(actor.workspaceId, next.id);
      }
    },

    async setDefaultProvider(actor: ActorContext, id: string): Promise<void> {
      requireSecretKey();
      await assertManager(actor);
      await requireProvider(actor.workspaceId, id);
      await providers.setDefault(actor.workspaceId, id);
    },

    async testProvider(actor: ActorContext, id: string): Promise<{ ok: true }> {
      requireSecretKey();
      await assertManager(actor);
      const settings = await toSettings(await requireProvider(actor.workspaceId, id));
      try {
        await deps.probeModel(settings);
      } catch (error) {
        throw new BadGatewayError('AI_PROVIDER_FAILED', describeProviderError(error));
      }
      return { ok: true };
    },

    async listModels(actor: ActorContext, input: ListModelsInput): Promise<{ models: string[] }> {
      requireSecretKey();
      await assertManager(actor);
      const baseUrl = resolveBaseUrl(input.kind, input.baseUrl);
      const typedKey = input.apiKey?.trim();
      const storedKey =
        !typedKey && input.providerId
          ? (await toSettings(await requireProvider(actor.workspaceId, input.providerId))).apiKey
          : null;

      try {
        return { models: await deps.fetchModels({ kind: input.kind, baseUrl, apiKey: typedKey || storedKey }) };
      } catch (error) {
        throw new BadGatewayError('AI_PROVIDER_FAILED', describeProviderError(error));
      }
    },

    // Picks the first candidate id that still exists in the workspace, then the default provider.
    async resolveProvider(
      workspaceId: string,
      candidateIds: Array<string | null | undefined>
    ): Promise<ResolvedProvider> {
      requireSecretKey();
      for (const id of candidateIds) {
        if (!id) continue;
        const provider = await providers.findById(workspaceId, id);
        if (provider) return { providerId: provider.id, settings: await toSettings(provider) };
      }

      const fallback = await providers.findDefault(workspaceId);
      if (!fallback) {
        throw new BadRequestError('AI_PROVIDER_MISSING', 'Add an AI provider before starting a chat');
      }
      return { providerId: fallback.id, settings: await toSettings(fallback) };
    }
  };
}

export type AiProviderService = ReturnType<typeof createAiProviderService>;
