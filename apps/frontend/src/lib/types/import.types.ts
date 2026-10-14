export type ImportTransactionType = 'income' | 'expense';

export type ImportAccountDraft = {
	name: string;
	accountId: string | null;
	type: 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'investment' | 'other';
	currency: string;
};

export type ImportCategoryDraft = { name: string; categoryId: string | null; type: ImportTransactionType };

export type ImportRowDraft = {
	key: number;
	occurredAt: string;
	type: ImportTransactionType;
	amount: number;
	accountName: string;
	categoryName: string | null;
	note: string;
	duplicate: boolean;
	issues: string[];
};

export type ImportPreview = {
	fileName: string;
	kind: 'csv' | 'xlsx' | 'pdf' | 'text';
	warnings: string[];
	accounts: ImportAccountDraft[];
	categories: ImportCategoryDraft[];
	rows: ImportRowDraft[];
};

export type ImportCommitPayload = {
	accounts: ImportAccountDraft[];
	categories: ImportCategoryDraft[];
	rows: Array<Omit<ImportRowDraft, 'key' | 'duplicate' | 'issues'>>;
};

export type ImportResult = { createdAccounts: number; createdCategories: number; createdTransactions: number };
