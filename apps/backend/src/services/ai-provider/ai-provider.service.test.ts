import { describe, expect, test } from 'bun:test';
import type { AiProviderRepository } from '../../repositories/ai-provider.repository';
import type { AiProviderRecord } from '../../types/ai.types';
import type { WorkspaceMembership } from '../../types/auth.types';
import type { LanguageModelSettings } from '../../integrations/ai/create-language-model';
import type { ModelListSettings } from '../../integrations/ai/list-provider-models';
import type { SecretKey } from '../../integrations/crypto/secret-box';
import { createAiProviderService } from './ai-provider.service';

const KEY = new Uint8Array(32);
const actor = { userId: 'u1', workspaceId: 'ws' };
const now = new Date();

const makeProvider = (overrides: Partial<AiProviderRecord> = {}): AiProviderRecord => ({
  id: 'p1',
  workspaceId: 'ws',
  name: 'Claude',
  kind: 'anthropic',
  baseUrl: null,
  apiKeyEncrypted: null,
  apiKeyHint: null,
  model: 'claude-sonnet-5-5',
  isDefault: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const createFakeRepository = (initial: AiProviderRecord[] = []) => {
  let rows = [...initial];
  let nextId = 1;
  const repository: AiProviderRepository = {
    list: async (workspaceId) => rows.filter((row) => row.workspaceId === workspaceId),
    findById: async (workspaceId, id) => rows.find((row) => row.workspaceId === workspaceId && row.id === id),
    findDefault: async (workspaceId) => rows.find((row) => row.workspaceId === workspaceId && row.isDefault),
    insert: async (values) => {
      if (rows.some((row) => row.workspaceId === values.workspaceId && row.name === values.name)) {
        throw Object.assign(new Error('duplicate'), { code: '23505' });
      }
      const row = makeProvider({ ...values, id: `new-${nextId++}` } as Partial<AiProviderRecord>);
      rows.push(row);
      return row;
    },
    update: async (workspaceId, id, patch) => {
      const index = rows.findIndex((row) => row.workspaceId === workspaceId && row.id === id);
      if (index < 0) return undefined;
      rows[index] = { ...rows[index]!, ...patch } as AiProviderRecord;
      return rows[index];
    },
    delete: async (workspaceId, id) => {
      rows = rows.filter((row) => !(row.workspaceId === workspaceId && row.id === id));
    },
    setDefault: async (workspaceId, id) => {
      rows = rows.map((row) =>
        row.workspaceId === workspaceId ? { ...row, isDefault: row.id === id } : row
      );
    }
  };
  return { repository, rows: () => rows };
};

function setup({
  providers = [] as AiProviderRecord[],
  role = 'owner' as WorkspaceMembership['role'] | undefined,
  secretKey = KEY as SecretKey | null,
  probeModel = async (_settings: LanguageModelSettings) => {},
  fetchModels = async (_settings: ModelListSettings): Promise<string[]> => ['model-a']
} = {}) {
  const fake = createFakeRepository(providers);
  const service = createAiProviderService({
    providers: fake.repository,
    workspaces: { findRole: async () => role },
    secretKey,
    encryptSecret: async (_key, plaintext) => `sealed:${plaintext}`,
    decryptSecret: async (_key, sealed) => sealed.replace('sealed:', ''),
    probeModel,
    fetchModels
  });
  return { service, rows: fake.rows };
}

describe('listProviders', () => {
  test('never exposes the encrypted api key', async () => {
    const { service } = setup({ providers: [makeProvider({ apiKeyEncrypted: 'sealed:sk', apiKeyHint: '••••' })] });

    const [provider] = await service.listProviders('ws');

    expect(provider).not.toHaveProperty('apiKeyEncrypted');
    expect(provider?.hasApiKey).toBe(true);
  });

  test('requires AI_SECRET_KEY', async () => {
    const { service } = setup({ secretKey: null });
    expect(service.listProviders('ws')).rejects.toMatchObject({ status: 503, code: 'AI_NOT_CONFIGURED' });
  });
});

describe('createProvider', () => {
  test('makes the first provider the default and seals its api key', async () => {
    const { service, rows } = setup();

    const provider = await service.createProvider(actor, {
      name: ' Claude ',
      kind: 'anthropic',
      model: 'claude-sonnet-5-5',
      apiKey: 'sk-ant-12345678'
    });

    expect(provider).toMatchObject({ name: 'Claude', isDefault: true, hasApiKey: true, apiKeyHint: '••••5678' });
    expect(rows()[0]?.apiKeyEncrypted).toBe('sealed:sk-ant-12345678');
  });

  test('does not make later providers the default', async () => {
    const { service } = setup({ providers: [makeProvider({ isDefault: true })] });

    const provider = await service.createProvider(actor, { name: 'GPT', kind: 'openai', model: 'gpt-5' });

    expect(provider.isDefault).toBe(false);
  });

  test('requires a base URL for OpenAI-compatible providers', async () => {
    const { service } = setup();
    expect(
      service.createProvider(actor, { name: 'Ollama', kind: 'openai_compatible', model: 'llama3.1' })
    ).rejects.toMatchObject({ code: 'BASE_URL_REQUIRED' });
  });

  test('rejects a base URL that is not http(s)', async () => {
    const { service } = setup();
    expect(
      service.createProvider(actor, {
        name: 'Ollama',
        kind: 'openai_compatible',
        model: 'llama3.1',
        baseUrl: 'ftp://host'
      })
    ).rejects.toMatchObject({ code: 'INVALID_BASE_URL' });
  });

  test('stores an OpenAI-compatible provider without an api key', async () => {
    const { service } = setup();

    const provider = await service.createProvider(actor, {
      name: 'Ollama',
      kind: 'openai_compatible',
      model: 'llama3.1',
      baseUrl: 'http://localhost:11434/v1/'
    });

    expect(provider).toMatchObject({ baseUrl: 'http://localhost:11434/v1', hasApiKey: false });
  });

  test('maps a duplicate name to AI_PROVIDER_NAME_TAKEN', async () => {
    const { service } = setup({ providers: [makeProvider()] });
    expect(
      service.createProvider(actor, { name: 'Claude', kind: 'anthropic', model: 'x' })
    ).rejects.toMatchObject({ status: 409, code: 'AI_PROVIDER_NAME_TAKEN' });
  });

  test('rejects members who are not owners or admins', async () => {
    const { service } = setup({ role: 'member' });
    expect(
      service.createProvider(actor, { name: 'GPT', kind: 'openai', model: 'gpt-5' })
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN_ROLE' });
  });
});

describe('updateProvider', () => {
  test('keeps the existing api key when none is given', async () => {
    const { service, rows } = setup({ providers: [makeProvider({ apiKeyEncrypted: 'sealed:old' })] });

    await service.updateProvider(actor, 'p1', { model: 'claude-opus-5-5' });

    expect(rows()[0]).toMatchObject({ model: 'claude-opus-5-5', apiKeyEncrypted: 'sealed:old' });
  });

  test('replaces the api key when a new one is given', async () => {
    const { service, rows } = setup({ providers: [makeProvider({ apiKeyEncrypted: 'sealed:old' })] });

    await service.updateProvider(actor, 'p1', { apiKey: 'sk-new-9999' });

    expect(rows()[0]).toMatchObject({ apiKeyEncrypted: 'sealed:sk-new-9999', apiKeyHint: '••••9999' });
  });

  test('clears the api key on request', async () => {
    const { service, rows } = setup({ providers: [makeProvider({ apiKeyEncrypted: 'sealed:old' })] });

    await service.updateProvider(actor, 'p1', { clearApiKey: true });

    expect(rows()[0]).toMatchObject({ apiKeyEncrypted: null, apiKeyHint: null });
  });

  test('revalidates the base URL when switching to OpenAI-compatible', async () => {
    const { service } = setup({ providers: [makeProvider()] });
    expect(service.updateProvider(actor, 'p1', { kind: 'openai_compatible' })).rejects.toMatchObject({
      code: 'BASE_URL_REQUIRED'
    });
  });

  test('throws NOT_FOUND for a provider in another workspace', async () => {
    const { service } = setup({ providers: [makeProvider({ workspaceId: 'other' })] });
    expect(service.updateProvider(actor, 'p1', { name: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('deleteProvider', () => {
  test('promotes another provider when the default is deleted', async () => {
    const { service, rows } = setup({
      providers: [makeProvider({ isDefault: true }), makeProvider({ id: 'p2', name: 'GPT' })]
    });

    await service.deleteProvider(actor, 'p1');

    expect(rows()).toEqual([expect.objectContaining({ id: 'p2', isDefault: true })]);
  });
});

describe('setDefaultProvider', () => {
  test('moves the default flag', async () => {
    const { service, rows } = setup({
      providers: [makeProvider({ isDefault: true }), makeProvider({ id: 'p2', name: 'GPT' })]
    });

    await service.setDefaultProvider(actor, 'p2');

    expect(rows().map((row) => [row.id, row.isDefault])).toEqual([
      ['p1', false],
      ['p2', true]
    ]);
  });
});

describe('testProvider', () => {
  test('probes the model with the decrypted api key', async () => {
    const probed: LanguageModelSettings[] = [];
    const { service } = setup({
      providers: [makeProvider({ apiKeyEncrypted: 'sealed:sk-1' })],
      probeModel: async (settings) => {
        probed.push(settings);
      }
    });

    expect(await service.testProvider(actor, 'p1')).toEqual({ ok: true });
    expect(probed[0]).toMatchObject({ kind: 'anthropic', apiKey: 'sk-1' });
  });

  test('maps probe failures to AI_PROVIDER_FAILED', async () => {
    const { service } = setup({
      providers: [makeProvider()],
      probeModel: async () => {
        throw new Error('Invalid API key');
      }
    });
    expect(service.testProvider(actor, 'p1')).rejects.toMatchObject({
      status: 502,
      code: 'AI_PROVIDER_FAILED',
      message: 'Invalid API key'
    });
  });
});

describe('listModels', () => {
  test('uses the typed api key and normalized base URL', async () => {
    const requested: ModelListSettings[] = [];
    const { service } = setup({
      fetchModels: async (settings) => {
        requested.push(settings);
        return ['llama3.1'];
      }
    });

    const result = await service.listModels(actor, {
      kind: 'openai_compatible',
      baseUrl: 'http://localhost:11434/v1/',
      apiKey: ' sk-typed '
    });

    expect(result).toEqual({ models: ['llama3.1'] });
    expect(requested[0]).toEqual({ kind: 'openai_compatible', baseUrl: 'http://localhost:11434/v1', apiKey: 'sk-typed' });
  });

  test("falls back to the saved provider's key when none is typed", async () => {
    const requested: ModelListSettings[] = [];
    const { service } = setup({
      providers: [makeProvider({ apiKeyEncrypted: 'sealed:sk-stored' })],
      fetchModels: async (settings) => {
        requested.push(settings);
        return [];
      }
    });

    await service.listModels(actor, { kind: 'google', providerId: 'p1' });

    expect(requested[0]?.apiKey).toBe('sk-stored');
  });

  test('maps fetch failures to AI_PROVIDER_FAILED', async () => {
    const { service } = setup({
      fetchModels: async () => {
        throw new Error('API key not valid');
      }
    });
    expect(service.listModels(actor, { kind: 'google', apiKey: 'bad' })).rejects.toMatchObject({
      status: 502,
      code: 'AI_PROVIDER_FAILED',
      message: 'API key not valid'
    });
  });

  test('is limited to owners and admins', async () => {
    const { service } = setup({ role: 'member' });
    expect(service.listModels(actor, { kind: 'openai', apiKey: 'k' })).rejects.toMatchObject({ code: 'FORBIDDEN_ROLE' });
  });
});

describe('resolveProvider', () => {
  test('uses the first candidate that exists', async () => {
    const { service } = setup({
      providers: [makeProvider({ isDefault: true }), makeProvider({ id: 'p2', name: 'GPT', kind: 'openai' })]
    });

    const resolved = await service.resolveProvider('ws', ['missing', 'p2']);

    expect(resolved).toMatchObject({ providerId: 'p2', settings: { kind: 'openai' } });
  });

  test('falls back to the default provider', async () => {
    const { service } = setup({ providers: [makeProvider({ isDefault: true })] });
    expect((await service.resolveProvider('ws', [null])).providerId).toBe('p1');
  });

  test('throws AI_PROVIDER_MISSING when the workspace has no provider', async () => {
    const { service } = setup();
    expect(service.resolveProvider('ws', [])).rejects.toMatchObject({ code: 'AI_PROVIDER_MISSING' });
  });
});
