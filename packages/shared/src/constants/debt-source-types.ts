export const DEBT_SOURCE_TYPES = [
  'personal',
  'paylater',
  'installment',
  'credit_card',
  'online_loan',
  'bank_loan',
  'other'
] as const;

export type DebtSourceType = (typeof DEBT_SOURCE_TYPES)[number];
