import { BadRequestError, NotFoundError } from '../../errors/app-error';
import type { AccountRepository } from '../../repositories/account.repository';
import type { CategoryRepository } from '../../repositories/category.repository';
import type { ImportRepository } from '../../repositories/import.repository';
import type { Account, Category, NewAccount, NewCategory, NewTransaction } from '../../types/finance.types';
import type { ImportCommitPayload, ImportCommitResult } from '../../types/import.types';
import { findByName, normalizeName } from '../../domain/import/match-by-name';
import { validateTransaction } from '../../domain/transaction/validate-transaction';
import type { ActorContext } from '../ai-provider.service';

type Dependencies = {
  accounts: Pick<AccountRepository, 'list'>;
  categories: Pick<CategoryRepository, 'list'>;
  imports: Pick<ImportRepository, 'commit'>;
  generateId: () => string;
};

const MAX_ROWS = 2000;

export function createImportCommitService({ accounts, categories, imports, generateId }: Dependencies) {
  function resolveAccounts(workspaceId: string, drafts: ImportCommitPayload['accounts'], existing: Account[]) {
    const created: NewAccount[] = [];
    const byName = new Map<string, Account>();
    for (const draft of drafts) {
      let account = draft.accountId ? existing.find((row) => row.id === draft.accountId) : findByName(existing, draft.name);
      if (draft.accountId && !account) throw new NotFoundError('Account');
      if (!account) {
        const values: NewAccount = {
          id: generateId(),
          workspaceId,
          name: draft.name.trim(),
          type: draft.type,
          currency: draft.currency,
          initialBalance: 0
        };
        created.push(values);
        account = { ...values, isArchived: false, sortOrder: 0 } as Account;
      }
      byName.set(normalizeName(draft.name), account);
    }
    return { created, byName };
  }

  function resolveCategories(workspaceId: string, drafts: ImportCommitPayload['categories'], existing: Category[]) {
    const created: NewCategory[] = [];
    const byName = new Map<string, Category>();
    for (const draft of drafts) {
      let category = draft.categoryId ? existing.find((row) => row.id === draft.categoryId) : findByName(existing, draft.name);
      if (draft.categoryId && !category) throw new NotFoundError('Category');
      if (!category) {
        const values: NewCategory = { id: generateId(), workspaceId, name: draft.name.trim(), type: draft.type, parentId: null };
        created.push(values);
        category = { ...values, isArchived: false } as Category;
      }
      byName.set(normalizeName(draft.name), category);
    }
    return { created, byName };
  }

  return {
    async commitImport(actor: ActorContext, payload: ImportCommitPayload): Promise<ImportCommitResult> {
      if (payload.rows.length === 0) throw new BadRequestError('IMPORT_EMPTY', 'There is nothing to import');
      if (payload.rows.length > MAX_ROWS) {
        throw new BadRequestError('IMPORT_TOO_MANY_ROWS', `At most ${MAX_ROWS} transactions can be imported at once`);
      }

      const [existingAccounts, existingCategories] = await Promise.all([
        accounts.list(actor.workspaceId),
        categories.list(actor.workspaceId)
      ]);
      const resolvedAccounts = resolveAccounts(actor.workspaceId, payload.accounts, existingAccounts);
      const resolvedCategories = resolveCategories(actor.workspaceId, payload.categories, existingCategories);

      const transactions = payload.rows.map((row, index): NewTransaction => {
        const invalid = (message: string) => new BadRequestError('IMPORT_INVALID_ROW', `Row ${index + 1}: ${message}`);
        const account = resolvedAccounts.byName.get(normalizeName(row.accountName));
        if (!account) throw invalid('unknown account');
        const category = row.categoryName ? resolvedCategories.byName.get(normalizeName(row.categoryName)) : undefined;
        if (row.categoryName && !category) throw invalid('unknown category');
        const occurredAt = new Date(row.occurredAt);
        if (Number.isNaN(occurredAt.getTime())) throw invalid('invalid date');

        try {
          validateTransaction(
            { type: row.type, accountId: account.id, toAccountId: null, categoryId: category?.id ?? null, amount: row.amount, toAmount: null },
            { account, category }
          );
        } catch (error) {
          throw invalid(error instanceof Error ? error.message : 'invalid transaction');
        }

        return {
          workspaceId: actor.workspaceId,
          type: row.type,
          accountId: account.id,
          categoryId: category?.id ?? null,
          amount: row.amount,
          occurredAt,
          note: row.note.trim() || null,
          source: 'import',
          createdBy: actor.userId
        };
      });

      await imports.commit({ accounts: resolvedAccounts.created, categories: resolvedCategories.created, transactions });
      return {
        createdAccounts: resolvedAccounts.created.length,
        createdCategories: resolvedCategories.created.length,
        createdTransactions: transactions.length
      };
    }
  };
}

export type ImportCommitService = ReturnType<typeof createImportCommitService>;
