import { ConflictError, NotFoundError } from '../errors/app-error';
import type { AccountRepository } from '../repositories/account.repository';
import type { Account, AccountPatch, NewAccount } from '../types/finance.types';
import { calculateAccountBalance } from '../domain/transaction/calculate-account-balance';
import { isUniqueViolation } from '../utils/is-unique-violation';

export type CreateAccountInput = Pick<NewAccount, 'name' | 'type' | 'currency'> &
  Partial<Pick<NewAccount, 'initialBalance' | 'sortOrder'>>;

export type AccountWithBalance = Account & { balance: number };

export function createAccountService(repository: AccountRepository) {
  async function loadBalances(workspaceId: string) {
    const [outgoing, incoming] = await Promise.all([
      repository.sumOutgoing(workspaceId),
      repository.sumIncomingTransfers(workspaceId)
    ]);
    return {
      outgoingByAccount: new Map(outgoing.map((row) => [row.accountId, row])),
      incomingByAccount: new Map(incoming.map((row) => [row.accountId, row]))
    };
  }

  async function requireAccount(workspaceId: string, id: string) {
    const account = await repository.findById(workspaceId, id);
    if (!account) throw new NotFoundError('Account');
    return account;
  }

  async function runUniqueNameWrite<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('ACCOUNT_NAME_TAKEN', 'An account with this name already exists');
      }
      throw error;
    }
  }

  return {
    async listAccounts(workspaceId: string): Promise<AccountWithBalance[]> {
      const [accounts, { outgoingByAccount, incomingByAccount }] = await Promise.all([
        repository.list(workspaceId),
        loadBalances(workspaceId)
      ]);
      return accounts.map((account) => ({
        ...account,
        balance: calculateAccountBalance(
          account.initialBalance,
          outgoingByAccount.get(account.id),
          incomingByAccount.get(account.id)
        )
      }));
    },

    async getAccount(workspaceId: string, id: string): Promise<AccountWithBalance> {
      const account = await requireAccount(workspaceId, id);
      const { outgoingByAccount, incomingByAccount } = await loadBalances(workspaceId);
      return {
        ...account,
        balance: calculateAccountBalance(
          account.initialBalance,
          outgoingByAccount.get(id),
          incomingByAccount.get(id)
        )
      };
    },

    async createAccount(workspaceId: string, input: CreateAccountInput): Promise<Account> {
      return runUniqueNameWrite(() => repository.insert({ ...input, workspaceId }));
    },

    async updateAccount(workspaceId: string, id: string, patch: AccountPatch): Promise<Account> {
      const account = await requireAccount(workspaceId, id);

      const isChangingCurrency = patch.currency !== undefined && patch.currency !== account.currency;
      if (isChangingCurrency && (await repository.countTransactions(workspaceId, id)) > 0) {
        throw new ConflictError(
          'ACCOUNT_HAS_TRANSACTIONS',
          'Cannot change the currency of an account that has transactions'
        );
      }

      const updated = await runUniqueNameWrite(() => repository.update(workspaceId, id, patch));
      if (!updated) throw new NotFoundError('Account');
      return updated;
    },

    async deleteAccount(workspaceId: string, id: string): Promise<void> {
      await requireAccount(workspaceId, id);
      if ((await repository.countTransactions(workspaceId, id)) > 0) {
        throw new ConflictError(
          'ACCOUNT_HAS_TRANSACTIONS',
          'Account has transactions; archive it instead of deleting'
        );
      }
      await repository.delete(workspaceId, id);
    }
  };
}
