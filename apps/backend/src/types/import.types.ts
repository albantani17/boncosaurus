import type { AccountType, ImportTransactionType } from '@boncosaurus/shared';
import type { DecimalSeparator } from '../domain/import/parse-amount';

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

export type ImportAccountType = AccountType;

export type {
  ImportAccountDraft,
  ImportCategoryDraft,
  ImportCommitPayload,
  ImportCommitResult,
  ImportCommitRow,
  ImportPreview,
  ImportRowDraft,
  ImportTransactionType
} from '@boncosaurus/shared';
