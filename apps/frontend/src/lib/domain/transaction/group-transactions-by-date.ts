import type { TransactionRowData } from '../../types/transaction-row.types';
import { formatDayLabel } from '../../utils/format-day-label';

export type TransactionGroup = { key: string; label: string; rows: TransactionRowData[] };

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export function groupTransactionsByDate(rows: TransactionRowData[], now: Date): TransactionGroup[] {
	const groupsByKey = new Map<string, TransactionGroup>();
	for (const row of rows) {
		const occurredAt = new Date(row.occurredAt);
		const key = dayKey(occurredAt);
		const group = groupsByKey.get(key);
		if (group) {
			group.rows.push(row);
		} else {
			groupsByKey.set(key, { key, label: formatDayLabel(occurredAt, now), rows: [row] });
		}
	}
	return [...groupsByKey.values()];
}
