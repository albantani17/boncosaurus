import type { Category, CategoryType } from '../../types/api.types';

// Matches the default categories seeded for new workspaces.
const DEFAULT_CHARGE_CATEGORY_NAMES: Record<CategoryType, string> = {
	expense: 'Bunga & Biaya',
	income: 'Bunga diterima'
};

/** The category an interest, fee or overpayment goes to unless the user picks another. */
export function pickChargeCategory(categories: Category[], type: CategoryType): Category | undefined {
	const name = DEFAULT_CHARGE_CATEGORY_NAMES[type].toLowerCase();
	return categories.find((category) => category.type === type && !category.isArchived && category.name.toLowerCase() === name);
}
