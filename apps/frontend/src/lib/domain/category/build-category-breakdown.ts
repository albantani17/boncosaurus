import type { Category, CategoryTotal } from '../../types/api.types';

export type BreakdownItem = { label: string; total: number; percent: number };

const MAX_NAMED_ITEMS = 5;
const UNCATEGORIZED_LABEL = 'Tanpa kategori';
const OTHERS_LABEL = 'Lainnya';

export function buildCategoryBreakdown(
	rows: CategoryTotal[],
	categories: Category[],
	currency: string
): BreakdownItem[] {
	const namesById = new Map(categories.map((category) => [category.id, category.name]));
	const expenseRows = rows
		.filter((row) => row.type === 'expense' && row.currency === currency && row.total > 0)
		.map((row) => ({
			label: row.categoryId ? (namesById.get(row.categoryId) ?? UNCATEGORIZED_LABEL) : UNCATEGORIZED_LABEL,
			total: row.total
		}))
		.sort((a, b) => b.total - a.total);

	const grandTotal = expenseRows.reduce((sum, row) => sum + row.total, 0);
	if (grandTotal === 0) return [];

	const named = expenseRows.slice(0, MAX_NAMED_ITEMS);
	const othersTotal = expenseRows.slice(MAX_NAMED_ITEMS).reduce((sum, row) => sum + row.total, 0);
	const items = othersTotal > 0 ? [...named, { label: OTHERS_LABEL, total: othersTotal }] : named;

	return items.map((item) => ({ ...item, percent: Math.round((item.total / grandTotal) * 100) }));
}
