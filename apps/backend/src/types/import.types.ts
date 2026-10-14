import type { DecimalSeparator } from '../utils/parse-amount';

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
