import { describe, expect, test } from 'bun:test';
import type { AccountRepository } from '../repositories/account.repository';
import type { Account } from '../types/finance.types';
import { createAccountService } from './account.service';

const now = new Date();
const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  workspaceId: 'ws',
  name: 'Cash',
  type: 'cash',
  currency: 'IDR',
  initialBalance: 1000,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const createFakeRepository = (overrides: Partial<AccountRepository> = {}) => {
  const deleted: string[] = [];
  const repository: AccountRepository = {
    list: async () => [],
    findById: async () => undefined,
    insert: async (values) => makeAccount(values as Partial<Account>),
    update: async (_ws, id, patch) => makeAccount({ id, ...patch }),
    delete: async (_ws, id) => {
      deleted.push(id);
    },
    countTransactions: async () => 0,
    sumOutgoing: async () => [],
    sumIncomingTransfers: async () => [],
    ...overrides
  };
  return { repository, deleted };
};

describe('listAccounts', () => {
  test('returns accounts with balance from initial balance and movements', async () => {
    const { repository } = createFakeRepository({
      list: async () => [makeAccount({ id: 'a', initialBalance: 1000 })],
      sumOutgoing: async () => [{ accountId: 'a', income: 500, expense: 200, transferOut: 100 }],
      sumIncomingTransfers: async () => [{ accountId: 'a', transferIn: 50 }]
    });

    const [account] = await createAccountService(repository).listAccounts('ws');

    expect(account?.balance).toBe(1250);
  });

  test('uses the initial balance for accounts without transactions', async () => {
    const { repository } = createFakeRepository({
      list: async () => [makeAccount({ initialBalance: 300 })]
    });

    const [account] = await createAccountService(repository).listAccounts('ws');

    expect(account?.balance).toBe(300);
  });
});

describe('getAccount', () => {
  test('throws not found when the account does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(createAccountService(repository).getAccount('ws', 'x')).rejects.toMatchObject({
      status: 404
    });
  });
});

describe('createAccount', () => {
  test('creates the account inside the given workspace', async () => {
    const { repository } = createFakeRepository();

    const account = await createAccountService(repository).createAccount('ws-9', {
      name: 'BCA',
      type: 'bank',
      currency: 'IDR'
    });

    expect(account.workspaceId).toBe('ws-9');
  });

  test('maps a unique violation to ACCOUNT_NAME_TAKEN', async () => {
    const { repository } = createFakeRepository({
      insert: async () => {
        throw { errno: '23505' };
      }
    });

    await expect(
      createAccountService(repository).createAccount('ws', { name: 'Cash', type: 'cash', currency: 'IDR' })
    ).rejects.toMatchObject({ status: 409, code: 'ACCOUNT_NAME_TAKEN' });
  });

  test('rethrows other errors', async () => {
    const { repository } = createFakeRepository({
      insert: async () => {
        throw new Error('db down');
      }
    });

    await expect(
      createAccountService(repository).createAccount('ws', { name: 'Cash', type: 'cash', currency: 'IDR' })
    ).rejects.toThrow('db down');
  });
});

describe('updateAccount', () => {
  test('throws not found when the account does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(
      createAccountService(repository).updateAccount('ws', 'x', { name: 'New' })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('rejects a currency change when the account has transactions', async () => {
    const { repository } = createFakeRepository({
      findById: async () => makeAccount(),
      countTransactions: async () => 2
    });

    await expect(
      createAccountService(repository).updateAccount('ws', 'acc-1', { currency: 'USD' })
    ).rejects.toMatchObject({ status: 409, code: 'ACCOUNT_HAS_TRANSACTIONS' });
  });

  test('allows a currency change when the account has no transactions', async () => {
    const { repository } = createFakeRepository({ findById: async () => makeAccount() });

    const account = await createAccountService(repository).updateAccount('ws', 'acc-1', {
      currency: 'USD'
    });

    expect(account.currency).toBe('USD');
  });

  test('allows renaming even when the account has transactions', async () => {
    const { repository } = createFakeRepository({
      findById: async () => makeAccount(),
      countTransactions: async () => 5
    });

    const account = await createAccountService(repository).updateAccount('ws', 'acc-1', {
      name: 'Dompet'
    });

    expect(account.name).toBe('Dompet');
  });
});

describe('deleteAccount', () => {
  test('deletes an account without transactions', async () => {
    const { repository, deleted } = createFakeRepository({ findById: async () => makeAccount() });

    await createAccountService(repository).deleteAccount('ws', 'acc-1');

    expect(deleted).toEqual(['acc-1']);
  });

  test('refuses to delete an account with transactions', async () => {
    const { repository, deleted } = createFakeRepository({
      findById: async () => makeAccount(),
      countTransactions: async () => 1
    });

    await expect(createAccountService(repository).deleteAccount('ws', 'acc-1')).rejects.toMatchObject({
      status: 409
    });
    expect(deleted).toEqual([]);
  });

  test('throws not found when the account does not exist', async () => {
    const { repository } = createFakeRepository();

    await expect(createAccountService(repository).deleteAccount('ws', 'x')).rejects.toMatchObject({
      status: 404
    });
  });
});
