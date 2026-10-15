export const TRANSACTION_SOURCES = ['manual', 'import', 'ai'] as const;

export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];
