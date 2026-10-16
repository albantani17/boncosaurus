// principal transactions move loan money and stay out of reports; charges (interest, fees,
// overpayment) are ordinary categorized income/expense.
export const DEBT_TRANSACTION_ROLES = ['principal', 'charge'] as const;

export type DebtTransactionRole = (typeof DEBT_TRANSACTION_ROLES)[number];
