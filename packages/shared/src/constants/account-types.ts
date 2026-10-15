export const ACCOUNT_TYPES = ['cash', 'bank', 'ewallet', 'credit_card', 'investment', 'other'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
