export type ScheduleSummary = { perInstallment: number; total: number; interest: number };

/** What a schedule adds up to; without a per-installment amount the principal is split evenly. */
export function summarizeSchedule(principal: number, count: number, installmentAmount: number | null): ScheduleSummary | null {
	if (!Number.isInteger(count) || count < 1 || principal <= 0) return null;
	const perInstallment = installmentAmount ?? Math.ceil(principal / count);
	const total = installmentAmount === null ? principal : installmentAmount * count;
	return { perInstallment, total, interest: Math.max(0, total - principal) };
}
