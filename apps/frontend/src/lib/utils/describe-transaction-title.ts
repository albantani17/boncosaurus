import type { TransactionRowData } from '../types/transaction-row.types';

const TYPE_LABELS: Record<TransactionRowData['type'], string> = {
	income: 'Pemasukan',
	expense: 'Pengeluaran',
	transfer: 'Transfer'
};

export function describeTransactionTitle(row: TransactionRowData): string {
	if (row.note) return row.note;
	if (row.type === 'transfer') return row.toAccountName ? `Transfer ke ${row.toAccountName}` : TYPE_LABELS.transfer;
	return row.categoryName || TYPE_LABELS[row.type];
}
