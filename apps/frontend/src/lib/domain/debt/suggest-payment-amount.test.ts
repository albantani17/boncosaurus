import { describe, expect, test } from 'bun:test';
import type { DebtInstallment } from '../../types/api.types';
import { suggestPaymentAmount } from './suggest-payment-amount';

const position = { totalDue: 315_000, paid: 150_000, remaining: 165_000, principalRemaining: 150_000, nextDueDate: null, nextDueAmount: null, isOverdue: false };
const installment = (sequence: number, paidAmount: number, status: DebtInstallment['status']): DebtInstallment => ({
	id: `i${sequence}`,
	sequence,
	dueDate: '2026-11-05',
	amount: 105_000,
	paidAmount,
	status
});

describe('suggestPaymentAmount', () => {
	test('suggests what is left of the next open installment', () => {
		const installments = [installment(1, 105_000, 'paid'), installment(2, 45_000, 'partial'), installment(3, 0, 'due')];
		expect(suggestPaymentAmount({ installments, position })).toBe(60_000);
	});

	test('suggests the whole remainder without a schedule', () => {
		expect(suggestPaymentAmount({ installments: [], position })).toBe(165_000);
	});

	test('falls back to the remainder once every installment is paid', () => {
		expect(suggestPaymentAmount({ installments: [installment(1, 105_000, 'paid')], position: { ...position, remaining: 0 } })).toBe(0);
	});
});
