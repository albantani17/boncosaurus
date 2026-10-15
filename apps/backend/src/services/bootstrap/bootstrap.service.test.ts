import { describe, expect, test } from 'bun:test';
import type {
  BootstrapConfig,
  BootstrapRepository,
  InitialWorkspaceInput
} from '../../types/bootstrap.types';
import { bootstrapFirstRun } from './bootstrap.service';

const config: BootstrapConfig = {
  adminEmail: 'budi@example.com',
  adminName: 'Budi',
  adminPassword: 'rahasia123',
  workspaceName: 'Keuangan Saya',
  baseCurrency: 'IDR'
};

const fakeHash = async (password: string) => `hashed:${password}`;

type HarnessOptions = {
  existingUsers?: number;
  createError?: unknown;
  usersAfterFailure?: number;
  adminNeedsPassword?: boolean;
};

const createHarness = ({
  existingUsers = 0,
  createError,
  usersAfterFailure = existingUsers,
  adminNeedsPassword = false
}: HarnessOptions = {}) => {
  const created: InitialWorkspaceInput[] = [];
  const passwordsSet: Array<{ email: string; hash: string }> = [];
  let failed = false;

  const repository: BootstrapRepository = {
    countUsers: async () => (failed ? usersAfterFailure : existingUsers),
    createInitialWorkspace: async (input) => {
      if (createError) {
        failed = true;
        throw createError;
      }
      created.push(input);
    },
    adminNeedsPassword: async () => adminNeedsPassword,
    setAdminPassword: async (email, hash) => {
      passwordsSet.push({ email, hash });
    }
  };
  return { repository, created, passwordsSet };
};

describe('bootstrapFirstRun', () => {
  test('skips and writes nothing when config is null', async () => {
    const { repository, created } = createHarness();

    expect(await bootstrapFirstRun(null, repository, fakeHash)).toBe('skipped');
    expect(created).toHaveLength(0);
  });

  test('reports already-initialized when a user exists and has a password', async () => {
    const { repository, created, passwordsSet } = createHarness({ existingUsers: 1 });

    expect(await bootstrapFirstRun(config, repository, fakeHash)).toBe('already-initialized');
    expect(created).toHaveLength(0);
    expect(passwordsSet).toHaveLength(0);
  });

  test('sets the admin password when an existing admin has none (upgrade from pre-auth)', async () => {
    const { repository, passwordsSet } = createHarness({ existingUsers: 1, adminNeedsPassword: true });

    expect(await bootstrapFirstRun(config, repository, fakeHash)).toBe('admin-password-set');
    expect(passwordsSet).toEqual([{ email: 'budi@example.com', hash: 'hashed:rahasia123' }]);
  });

  test('creates the initial workspace with a hashed password, never the plain one', async () => {
    const { repository, created } = createHarness();

    expect(await bootstrapFirstRun(config, repository, fakeHash)).toBe('created');
    expect(created).toEqual([
      {
        adminEmail: 'budi@example.com',
        adminName: 'Budi',
        adminPasswordHash: 'hashed:rahasia123',
        workspaceName: 'Keuangan Saya',
        baseCurrency: 'IDR'
      }
    ]);
    expect(JSON.stringify(created)).not.toContain('"adminPassword"');
  });

  test('treats a unique violation as already-initialized when another instance created the user', async () => {
    const { repository } = createHarness({ createError: { code: '23505' }, usersAfterFailure: 1 });

    expect(await bootstrapFirstRun(config, repository, fakeHash)).toBe('already-initialized');
  });

  test('rethrows a unique violation when no user was created (real conflict)', async () => {
    const uniqueError = { code: '23505', message: 'duplicate category' };
    const { repository } = createHarness({ createError: uniqueError, usersAfterFailure: 0 });

    await expect(bootstrapFirstRun(config, repository, fakeHash)).rejects.toBe(uniqueError);
  });

  test('rethrows errors that are not unique violations', async () => {
    const { repository } = createHarness({ createError: new Error('connection lost') });

    await expect(bootstrapFirstRun(config, repository, fakeHash)).rejects.toThrow('connection lost');
  });
});
