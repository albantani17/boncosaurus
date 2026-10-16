export const DEBT_STATUSES = ['active', 'settled', 'written_off'] as const;

export type DebtStatus = (typeof DEBT_STATUSES)[number];
