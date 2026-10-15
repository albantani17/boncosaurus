import type { TransactionRowData } from '../types/transaction-row.types';
import { formatCurrency } from './format-currency';
import { formatTime } from './format-time';

export function describeTransactionMeta(row: TransactionRowData): string {
	const time = formatTime(new Date(row.occurredAt));
	if (row.type === 'transfer') {
		const fee = row.fee ? ` · biaya ${formatCurrency(row.fee, row.currency)}` : '';
		return `${row.accountName} → ${row.toAccountName ?? '-'}${fee} · ${time}`;
	}

	const showCategory = row.note && row.categoryName;
	return [showCategory ? row.categoryName : null, row.accountName, time].filter(Boolean).join(' · ');
}
