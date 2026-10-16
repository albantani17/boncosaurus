import { describe, expect, test } from 'bun:test';
import type { CounterpartyRepository } from '../../repositories/counterparty.repository';
import type { Counterparty } from '../../types/debt.types';
import { createCounterpartyService } from './counterparty.service';

const now = new Date();
const makeCounterparty = (overrides: Partial<Counterparty> = {}): Counterparty => ({
  id: 'cp-1',
  workspaceId: 'ws',
  name: 'Sultan',
  kind: 'person',
  note: null,
  isArchived: false,
  createdAt: now,
  updatedAt: now,
  ...overrides
});
const uniqueViolation = Object.assign(new Error('duplicate'), { code: '23505' });

const setup = (
  options: { existing?: Counterparty[]; debtCount?: number; writeError?: Error; vanishOnUpdate?: boolean } = {}
) => {
  const { existing = [makeCounterparty()], debtCount = 0, writeError, vanishOnUpdate = false } = options;
  const calls: { inserted: unknown[]; updated: unknown[]; deleted: string[] } = { inserted: [], updated: [], deleted: [] };
  const repository: CounterpartyRepository = {
    list: async () => existing,
    findById: async (_ws, id) => existing.find((row) => row.id === id),
    findByName: async (_ws, name) => existing.find((row) => row.name.toLowerCase() === name.toLowerCase()),
    insert: async (values) => {
      if (writeError) throw writeError;
      calls.inserted.push(values);
      return makeCounterparty(values as Partial<Counterparty>);
    },
    update: async (_ws, id, patch) => {
      if (writeError) throw writeError;
      calls.updated.push(patch);
      const row = existing.find((counterparty) => counterparty.id === id);
      return vanishOnUpdate ? undefined : row && { ...row, ...patch };
    },
    delete: async (_ws, id) => {
      calls.deleted.push(id);
    },
    countDebts: async () => debtCount
  };
  const service = createCounterpartyService({ repository, generateId: () => 'new-id' });
  return { service, calls };
};

describe('listCounterparties', () => {
  test('returns the counterparties of the workspace', async () => {
    const { service } = setup();
    expect(await service.listCounterparties('ws')).toEqual([makeCounterparty()]);
  });
});

describe('createCounterparty', () => {
  test('inserts a trimmed name into the workspace', async () => {
    const { service, calls } = setup();
    await service.createCounterparty('ws', { name: '  Hani ', kind: 'person' });
    expect(calls.inserted).toEqual([{ name: 'Hani', kind: 'person', workspaceId: 'ws' }]);
  });

  test('reports a taken name as a conflict', async () => {
    const { service } = setup({ writeError: uniqueViolation });
    await expect(service.createCounterparty('ws', { name: 'Sultan', kind: 'person' })).rejects.toMatchObject({
      status: 409,
      code: 'COUNTERPARTY_NAME_TAKEN'
    });
  });

  test('rethrows other write errors', async () => {
    const { service } = setup({ writeError: new Error('db down') });
    await expect(service.createCounterparty('ws', { name: 'X', kind: 'person' })).rejects.toThrow('db down');
  });
});

describe('updateCounterparty', () => {
  test('trims a new name', async () => {
    const { service, calls } = setup();
    expect(await service.updateCounterparty('ws', 'cp-1', { name: ' Sultan A ' })).toMatchObject({ name: 'Sultan A' });
    expect(calls.updated).toEqual([{ name: 'Sultan A' }]);
  });

  test('passes a patch without a name through', async () => {
    const { service, calls } = setup();
    await service.updateCounterparty('ws', 'cp-1', { isArchived: true });
    expect(calls.updated).toEqual([{ isArchived: true }]);
  });

  test('throws not found for an unknown counterparty', async () => {
    const { service } = setup();
    await expect(service.updateCounterparty('ws', 'x', {})).rejects.toMatchObject({ status: 404 });
  });

  test('throws not found when the row disappears during the update', async () => {
    const { service } = setup({ vanishOnUpdate: true });
    await expect(service.updateCounterparty('ws', 'cp-1', {})).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteCounterparty', () => {
  test('deletes a counterparty without debts', async () => {
    const { service, calls } = setup();
    await service.deleteCounterparty('ws', 'cp-1');
    expect(calls.deleted).toEqual(['cp-1']);
  });

  test('refuses to delete a counterparty that has debts', async () => {
    const { service } = setup({ debtCount: 2 });
    await expect(service.deleteCounterparty('ws', 'cp-1')).rejects.toMatchObject({ status: 409, code: 'COUNTERPARTY_IN_USE' });
  });
});

describe('resolveCounterparty', () => {
  test('uses an existing counterparty by id', async () => {
    const { service } = setup();
    expect(await service.resolveCounterparty('ws', { counterpartyId: 'cp-1' }, 'person')).toEqual({ id: 'cp-1' });
  });

  test('throws not found for an unknown id', async () => {
    const { service } = setup();
    await expect(service.resolveCounterparty('ws', { counterpartyId: 'x' }, 'person')).rejects.toMatchObject({ status: 404 });
  });

  test('matches an existing name regardless of case', async () => {
    const { service } = setup();
    expect(await service.resolveCounterparty('ws', { counterpartyName: ' sultan ' }, 'person')).toEqual({ id: 'cp-1' });
  });

  test('plans a new counterparty with the fallback kind', async () => {
    const { service } = setup();
    expect(await service.resolveCounterparty('ws', { counterpartyName: 'Kredivo' }, 'institution')).toEqual({
      id: 'new-id',
      created: { id: 'new-id', workspaceId: 'ws', name: 'Kredivo', kind: 'institution' }
    });
  });

  test('keeps an explicit kind for a new counterparty', async () => {
    const { service } = setup();
    const resolved = await service.resolveCounterparty('ws', { counterpartyName: 'Pak Aris', counterpartyKind: 'person' }, 'institution');
    expect(resolved.created?.kind).toBe('person');
  });

  test('requires an id or a name', async () => {
    const { service } = setup();
    await expect(service.resolveCounterparty('ws', { counterpartyName: '  ' }, 'person')).rejects.toMatchObject({
      code: 'COUNTERPARTY_REQUIRED'
    });
  });
});
