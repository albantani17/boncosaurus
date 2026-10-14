export type MonthRange = { from: Date; to: Date };

export function getMonthRange(reference: Date): MonthRange {
	const from = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
	const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
	return { from, to };
}
