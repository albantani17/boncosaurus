import { describe, expect, test } from 'bun:test';
import type { ColumnMapping } from '../types/import.types';
import { applyColumnMapping } from './apply-column-mapping';

const baseMapping: ColumnMapping = {
  headerRows: 1,
  dateColumn: 0,
  dateFormat: 'dd/MM/yyyy',
  descriptionColumn: 1,
  amountColumn: 2,
  debitColumn: null,
  creditColumn: null,
  typeColumn: null,
  incomeValues: [],
  expenseValues: [],
  accountColumn: null,
  categoryColumn: null,
  decimalSeparator: ',',
  negativeMeansExpense: true,
  defaultAccountName: 'BCA'
};
const header = ['Tanggal', 'Keterangan', 'Jumlah'];

describe('applyColumnMapping', () => {
  test('maps a signed amount column to expense and income', () => {
    const { transactions } = applyColumnMapping(
      [header, ['05/03/2025', 'Kopi', '-25.000,00'], ['06/03/2025', 'Gaji', '5.000.000,00']],
      baseMapping,
      0
    );
    expect(transactions.map((t) => [t.type, t.amount, t.note])).toEqual([
      ['expense', 25000, 'Kopi'],
      ['income', 5000000, 'Gaji']
    ]);
  });

  test('flips the sign convention when positive means expense', () => {
    const { transactions } = applyColumnMapping(
      [header, ['05/03/2025', 'Belanja', '100.000,00']],
      { ...baseMapping, negativeMeansExpense: false },
      0
    );
    expect(transactions[0].type).toBe('expense');
  });

  test('uses separate debit and credit columns', () => {
    const mapping = { ...baseMapping, amountColumn: null, debitColumn: 2, creditColumn: 3 };
    const { transactions } = applyColumnMapping(
      [
        ['Tgl', 'Ket', 'Debit', 'Kredit'],
        ['05/03/2025', 'Makan', '30.000,00', ''],
        ['06/03/2025', 'Transfer masuk', '', '70.000,00']
      ],
      mapping,
      0
    );
    expect(transactions.map((t) => [t.type, t.amount])).toEqual([
      ['expense', 30000],
      ['income', 70000]
    ]);
  });

  test('derives the type from a type column', () => {
    const mapping = { ...baseMapping, typeColumn: 3, incomeValues: ['pemasukan'], expenseValues: ['pengeluaran'] };
    const { transactions } = applyColumnMapping(
      [['a', 'b', 'c', 'd'], ['05/03/2025', 'Gaji', '1.000,00', 'Pemasukan'], ['05/03/2025', 'Kopi', '1.000,00', 'Pengeluaran']],
      mapping,
      0
    );
    expect(transactions.map((t) => t.type)).toEqual(['income', 'expense']);
  });

  test('reads account and category columns, falling back to the default account', () => {
    const mapping = { ...baseMapping, accountColumn: 3, categoryColumn: 4 };
    const { transactions } = applyColumnMapping(
      [['a', 'b', 'c', 'd', 'e'], ['05/03/2025', 'Kopi', '-1.000,00', 'Dompet', 'Makanan'], ['05/03/2025', 'Teh', '-1.000,00', '', '']],
      mapping,
      0
    );
    expect(transactions.map((t) => [t.accountName, t.categoryName])).toEqual([
      ['Dompet', 'Makanan'],
      ['BCA', null]
    ]);
  });

  test('skips header rows and reports unparsable rows by 1-based number', () => {
    const { transactions, skippedRows } = applyColumnMapping(
      [header, ['bukan tanggal', 'x', '1.000,00'], ['05/03/2025', 'ok', '-1.000,00'], ['05/03/2025', 'nol', '0,00']],
      baseMapping,
      0
    );
    expect(transactions).toHaveLength(1);
    expect(skippedRows).toEqual([2, 4]);
  });

  test('ignores completely empty rows without reporting them', () => {
    const { transactions, skippedRows } = applyColumnMapping(
      [header, ['05/03/2025', 'ok', '-1.000,00'], ['', '', ''], []],
      baseMapping,
      0
    );
    expect(transactions).toHaveLength(1);
    expect(skippedRows).toEqual([]);
  });

  test('returns no transactions for an empty table', () => {
    expect(applyColumnMapping([], baseMapping, 0)).toEqual({ transactions: [], skippedRows: [] });
  });
});
