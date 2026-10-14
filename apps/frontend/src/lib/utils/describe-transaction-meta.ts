import type { TransactionRowData } from '../types/transaction-row.types';
import { formatTime } from './format-time';

export function describeTransactionMeta(row: TransactionRowData): string {
	const time = formatTime(new Date(row.occurredAt));
	if (row.type === 'transfer') return `${row.accountName} → ${row.toAccountName ?? '-'} · ${time}`;

	const showCategory = row.note && row.categoryName;
	return [showCategory ? row.categoryName : null, row.accountName, time].filter(Boolean).join(' · ');
}
