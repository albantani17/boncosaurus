export const DEBT_DIRECTIONS = ['payable', 'receivable'] as const;

export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];
