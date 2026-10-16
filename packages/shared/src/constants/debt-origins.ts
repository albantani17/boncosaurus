// cash: money moved through an account; split: someone's share of an expense I paid;
// purchase: nothing moved yet (paylater, a friend paid for me).
export const DEBT_ORIGINS = ['cash', 'split', 'purchase'] as const;

export type DebtOrigin = (typeof DEBT_ORIGINS)[number];
