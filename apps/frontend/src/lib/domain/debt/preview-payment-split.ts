export type PaymentSplitPreview = { principalAmount: number; extraAmount: number };

/** Mirrors the backend: anything above the remaining principal is interest, a fee or a tip. */
export function previewPaymentSplit(amount: number, principalRemaining: number): PaymentSplitPreview {
	const principalAmount = Math.min(amount, Math.max(0, principalRemaining));
	return { principalAmount, extraAmount: amount - principalAmount };
}
