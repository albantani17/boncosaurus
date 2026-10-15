import type { ImportCommitPayload, ImportPreview } from '../../types/import.types';

export type ImportChoices = {
	selectedKeys: ReadonlySet<number>;
	accountIds: ReadonlyMap<string, string | null>;
	categoryIds: ReadonlyMap<string, string | null>;
};

const pick = (choices: ReadonlyMap<string, string | null>, name: string, fallback: string | null) =>
	choices.has(name) ? choices.get(name)! : fallback;

export function buildCommitPayload(preview: ImportPreview, choices: ImportChoices): ImportCommitPayload {
	const rows = preview.rows.filter((row) => choices.selectedKeys.has(row.key));
	const usedAccounts = new Set(rows.map((row) => row.accountName));
	const usedCategories = new Set(rows.flatMap((row) => (row.categoryName ? [row.categoryName] : [])));

	return {
		accounts: preview.accounts
			.filter((account) => usedAccounts.has(account.name))
			.map((account) => ({ ...account, accountId: pick(choices.accountIds, account.name, account.accountId) })),
		categories: preview.categories
			.filter((category) => usedCategories.has(category.name))
			.map((category) => ({ ...category, categoryId: pick(choices.categoryIds, category.name, category.categoryId) })),
		rows: rows.map(({ occurredAt, type, amount, accountName, categoryName, note }) => ({
			occurredAt,
			type,
			amount,
			accountName,
			categoryName,
			note
		}))
	};
}
