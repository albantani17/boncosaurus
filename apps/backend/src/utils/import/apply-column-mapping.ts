import type { ColumnMapping, ImportTransactionType, MappedRows, RawTransaction } from '../../types/import.types';
import { parseAmount } from './parse-amount';
import { parseDateWithFormat } from './parse-date-with-format';

type TypedAmount = { type: ImportTransactionType; amount: number };

export function applyColumnMapping(
  rows: string[][],
  mapping: ColumnMapping,
  utcOffsetMinutes: number
): MappedRows {
  const result: MappedRows = { transactions: [], skippedRows: [] };

  for (const [index, row] of rows.entries()) {
    if (index < mapping.headerRows || row.every((cell) => cell.trim() === '')) continue;
    const transaction = mapRow(row, mapping, utcOffsetMinutes);
    if (transaction) result.transactions.push(transaction);
    else result.skippedRows.push(index + 1);
  }
  return result;
}

function mapRow(row: string[], mapping: ColumnMapping, utcOffsetMinutes: number): RawTransaction | null {
  const occurredAt = parseDateWithFormat(cell(row, mapping.dateColumn), mapping.dateFormat, utcOffsetMinutes);
  const typed = readTypedAmount(row, mapping);
  if (!occurredAt || !typed || typed.amount === 0) return null;

  return {
    occurredAt,
    ...typed,
    note: cell(row, mapping.descriptionColumn),
    accountName: cell(row, mapping.accountColumn) || mapping.defaultAccountName,
    categoryName: cell(row, mapping.categoryColumn) || null
  };
}

function readTypedAmount(row: string[], mapping: ColumnMapping): TypedAmount | null {
  const { decimalSeparator } = mapping;

  if (mapping.debitColumn !== null || mapping.creditColumn !== null) {
    const debit = Math.abs(parseAmount(cell(row, mapping.debitColumn), decimalSeparator) ?? 0);
    const credit = Math.abs(parseAmount(cell(row, mapping.creditColumn), decimalSeparator) ?? 0);
    if (debit > 0 && credit === 0) return { type: 'expense', amount: debit };
    if (credit > 0 && debit === 0) return { type: 'income', amount: credit };
    return null;
  }

  const signed = parseAmount(cell(row, mapping.amountColumn), decimalSeparator);
  if (signed === null) return null;
  const amount = Math.abs(signed);

  if (mapping.typeColumn !== null) {
    const type = typeFromLabel(cell(row, mapping.typeColumn), mapping);
    return type ? { type, amount } : null;
  }
  const isExpense = mapping.negativeMeansExpense ? signed < 0 : signed > 0;
  return { type: isExpense ? 'expense' : 'income', amount };
}

function typeFromLabel(label: string, mapping: ColumnMapping): ImportTransactionType | null {
  const normalized = label.trim().toLowerCase();
  if (mapping.incomeValues.some((value) => value.toLowerCase() === normalized)) return 'income';
  if (mapping.expenseValues.some((value) => value.toLowerCase() === normalized)) return 'expense';
  return null;
}

function cell(row: string[], column: number | null): string {
  return column === null ? '' : (row[column] ?? '').trim();
}
