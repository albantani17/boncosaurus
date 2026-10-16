export type PaymentSplit = { principalAmount: number; extraAmount: number };

// Anything paid past the remaining principal is interest, a fee or a tip, so it is reported
// as a categorized charge instead of moving loan money.
export function splitPayment(amount: number, principalRemaining: number): PaymentSplit {
  const principalAmount = Math.min(amount, Math.max(0, principalRemaining));
  return { principalAmount, extraAmount: amount - principalAmount };
}
