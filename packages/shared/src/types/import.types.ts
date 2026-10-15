import type { AccountType } from '../constants/account-types';
import type { CategoryType } from '../constants/category-types';

export type ImportTransactionType = CategoryType;

export type ImportFileKind = 'csv' | 'xlsx' | 'pdf' | 'text';

export type ImportAccountDraft = {
  name: string;
  accountId: string | null;
  type: AccountType;
  currency: string;
};

export type ImportCategoryDraft = {
  name: string;
  categoryId: string | null;
  type: ImportTransactionType;
};

export type ImportCommitRow = {
  occurredAt: string;
  type: ImportTransactionType;
  amount: number;
  accountName: string;
  categoryName: string | null;
  note: string;
};

export type ImportRowDraft = ImportCommitRow & {
  key: number;
  duplicate: boolean;
  issues: string[];
};

export type ImportPreview = {
  fileName: string;
  kind: ImportFileKind;
  warnings: string[];
  accounts: ImportAccountDraft[];
  categories: ImportCategoryDraft[];
  rows: ImportRowDraft[];
};

export type ImportCommitPayload = {
  accounts: ImportAccountDraft[];
  categories: ImportCategoryDraft[];
  rows: ImportCommitRow[];
};

export type ImportCommitResult = {
  createdAccounts: number;
  createdCategories: number;
  createdTransactions: number;
};
