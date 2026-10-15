import type { DecimalSeparator } from '../domain/import/parse-amount';

export type ImportTransactionType = 'income' | 'expense';

export type ColumnMapping = {
  headerRows: number;
  dateColumn: number;
  dateFormat: string;
  descriptionColumn: number | null;
  amountColumn: number | null;
  debitColumn: number | null;
  creditColumn: number | null;
  typeColumn: number | null;
  incomeValues: string[];
  expenseValues: string[];
  accountColumn: number | null;
  categoryColumn: number | null;
  decimalSeparator: DecimalSeparator;
  negativeMeansExpense: boolean;
  defaultAccountName: string | null;
};

export type RawTransaction = {
  occurredAt: Date;
  type: ImportTransactionType;
  amount: number;
  note: string;
  accountName: string | null;
  categoryName: string | null;
};

export type MappedRows = {
  transactions: RawTransaction[];
  skippedRows: number[];
};

export type ExtractedContent =
  | { kind: 'table'; rows: string[][] }
  | { kind: 'text'; text: string };

export type ImportAccountType = 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment' | 'other';

export type ImportAccountDraft = {
  name: string;
  accountId: string | null;
  type: ImportAccountType;
  currency: string;
};

export type ImportCategoryDraft = {
  name: string;
  categoryId: string | null;
  type: ImportTransactionType;
};

export type ImportRowDraft = {
  key: number;
  occurredAt: string;
  type: ImportTransactionType;
  amount: number;
  accountName: string;
  categoryName: string | null;
  note: string;
  duplicate: boolean;
  issues: string[];
};

export type ImportPreview = {
  fileName: string;
  kind: 'csv' | 'xlsx' | 'pdf' | 'text';
  warnings: string[];
  accounts: ImportAccountDraft[];
  categories: ImportCategoryDraft[];
  rows: ImportRowDraft[];
};

export type ImportCommitRow = {
  occurredAt: string;
  type: ImportTransactionType;
  amount: number;
  accountName: string;
  categoryName: string | null;
  note: string;
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
