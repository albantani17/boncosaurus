import { AppError } from '../errors/app-error';
import type { ImportAccountDraft, ImportCategoryDraft, ImportRowDraft, RawTransaction } from '../types/import.types';
import type { Account, Category, Transaction } from '../types/finance.types';
import { detectDuplicates } from './detect-duplicates';
import { findByName, normalizeName } from './match-by-name';
import { validateTransaction } from './validate-transaction';

export type BuildImportRowsInput = {
  raw: RawTransaction[];
  accounts: Account[];
  categories: Category[];
  existing: Pick<Transaction, 'accountId' | 'occurredAt' | 'type' | 'amount' | 'note'>[];
  baseCurrency: string;
  fallbackAccountName: string;
  utcOffsetMinutes: number;
};

export type BuiltImportRows = {
  accounts: ImportAccountDraft[];
  categories: ImportCategoryDraft[];
  rows: ImportRowDraft[];
};

const MAX_NOTE_LENGTH = 500;

export function buildImportRows(input: BuildImportRowsInput): BuiltImportRows {
  const accountDrafts = new Map<string, ImportAccountDraft>();
  const categoryDrafts = new Map<string, ImportCategoryDraft>();

  const named = input.raw.map((transaction) => {
    const accountName = (transaction.accountName?.trim() || input.fallbackAccountName).slice(0, 100);
    const categoryName = transaction.categoryName?.trim().slice(0, 100) || null;

    const account = resolveAccount(accountName, input, accountDrafts);
    const category = categoryName ? resolveCategory(categoryName, transaction.type, input, categoryDrafts) : undefined;
    return { transaction, accountName, categoryName, account, category };
  });

  const duplicates = detectDuplicates(
    named.map(({ transaction, account }) => ({
      accountId: account.isExisting ? account.record.id : null,
      occurredAt: transaction.occurredAt,
      type: transaction.type,
      amount: transaction.amount,
      note: transaction.note
    })),
    input.existing,
    input.utcOffsetMinutes
  );

  const rows = named.map(({ transaction, accountName, categoryName, account, category }, index): ImportRowDraft => ({
    key: index,
    occurredAt: transaction.occurredAt.toISOString(),
    type: transaction.type,
    amount: transaction.amount,
    accountName,
    categoryName,
    note: transaction.note.slice(0, MAX_NOTE_LENGTH),
    duplicate: duplicates[index] ?? false,
    issues: collectIssues(transaction, account.record, category?.record)
  }));

  return { accounts: [...accountDrafts.values()], categories: [...categoryDrafts.values()], rows };
}

type Resolved<T> = { record: T; isExisting: boolean };

function resolveAccount(
  name: string,
  { accounts, baseCurrency }: BuildImportRowsInput,
  drafts: Map<string, ImportAccountDraft>
): Resolved<Account> {
  const existing = findByName(accounts, name);
  const key = normalizeName(name);
  if (!drafts.has(key)) {
    drafts.set(key, existing
      ? { name: existing.name, accountId: existing.id, type: existing.type, currency: existing.currency }
      : { name, accountId: null, type: 'bank', currency: baseCurrency });
  }
  if (existing) return { record: existing, isExisting: true };
  const draft = drafts.get(key)!;
  return { record: { id: `new-account:${key}`, isArchived: false, type: draft.type, currency: draft.currency } as Account, isExisting: false };
}

function resolveCategory(
  name: string,
  type: RawTransaction['type'],
  { categories }: BuildImportRowsInput,
  drafts: Map<string, ImportCategoryDraft>
): Resolved<Category> {
  const existing = findByName(categories, name);
  const key = normalizeName(name);
  if (!drafts.has(key)) {
    drafts.set(key, existing
      ? { name: existing.name, categoryId: existing.id, type: existing.type }
      : { name, categoryId: null, type });
  }
  if (existing) return { record: existing, isExisting: true };
  const draft = drafts.get(key)!;
  return { record: { id: `new-category:${key}`, isArchived: false, type: draft.type } as Category, isExisting: false };
}

function collectIssues(transaction: RawTransaction, account: Account, category: Category | undefined): string[] {
  if (!Number.isSafeInteger(transaction.amount) || transaction.amount <= 0) return ['Invalid amount'];
  try {
    validateTransaction(
      {
        type: transaction.type,
        accountId: account.id,
        toAccountId: null,
        categoryId: category?.id ?? null,
        amount: transaction.amount,
        toAmount: null
      },
      { account, category }
    );
    return [];
  } catch (error) {
    if (error instanceof AppError) return [error.message];
    throw error;
  }
}
