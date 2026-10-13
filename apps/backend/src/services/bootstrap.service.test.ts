import { describe, expect, test } from 'bun:test';
import type { BootstrapConfig, BootstrapRepository } from '../types/bootstrap.types';
import { bootstrapFirstRun } from './bootstrap.service';

const config: BootstrapConfig = {
  adminEmail: 'budi@example.com',
  adminName: 'Budi',
  workspaceName: 'Keuangan Saya',
  baseCurrency: 'IDR'
};

const createFakeRepository = (
  existingUsers: number,
  createError?: unknown,
  usersAfterFailure = existingUsers
) => {
  const created: BootstrapConfig[] = [];
  let failed = false;
  const repository: BootstrapRepository = {
    countUsers: async () => (failed ? usersAfterFailure : existingUsers),
    createInitialWorkspace: async (workspaceConfig) => {
      if (createError) {
        failed = true;
        throw createError;
      }
      created.push(workspaceConfig);
    }
  };
  return { repository, created };
};

describe('bootstrapFirstRun', () => {
  test('skips and writes nothing when config is null', async () => {
    const { repository, created } = createFakeRepository(0);

    expect(await bootstrapFirstRun(null, repository)).toBe('skipped');
    expect(created).toHaveLength(0);
  });

  test('reports already-initialized when a user exists', async () => {
    const { repository, created } = createFakeRepository(1);

    expect(await bootstrapFirstRun(config, repository)).toBe('already-initialized');
    expect(created).toHaveLength(0);
  });

  test('creates the initial workspace when the database is empty', async () => {
    const { repository, created } = createFakeRepository(0);

    expect(await bootstrapFirstRun(config, repository)).toBe('created');
    expect(created).toEqual([config]);
  });

  test('treats a unique violation as already-initialized when another instance created the user', async () => {
    const { repository } = createFakeRepository(0, { code: '23505' }, 1);

    expect(await bootstrapFirstRun(config, repository)).toBe('already-initialized');
  });

  test('rethrows a unique violation when no user was created (real conflict)', async () => {
    const uniqueError = { code: '23505', message: 'duplicate category' };
    const { repository } = createFakeRepository(0, uniqueError, 0);

    await expect(bootstrapFirstRun(config, repository)).rejects.toBe(uniqueError);
  });

  test('rethrows errors that are not unique violations', async () => {
    const { repository } = createFakeRepository(0, new Error('connection lost'));

    await expect(bootstrapFirstRun(config, repository)).rejects.toThrow('connection lost');
  });
});
