import { describe, expect, test } from 'bun:test';
import { toScheduleFormValues } from './to-schedule-form-values';

describe('toScheduleFormValues', () => {
	test('starts disabled without installments', () => {
		expect(toScheduleFormValues([])).toEqual({ enabled: false, firstDueDate: '', count: '3', installmentAmount: '' });
	});

	test('prefills an even schedule from its first installment', () => {
		const installments = [
			{ sequence: 2, dueDate: '2026-12-05', amount: 105_000 },
			{ sequence: 1, dueDate: '2026-11-05', amount: 105_000 }
		];
		expect(toScheduleFormValues(installments)).toEqual({
			enabled: true,
			firstDueDate: '2026-11-05',
			count: '2',
			installmentAmount: '105000'
		});
	});

	test('leaves the amount empty for an uneven schedule', () => {
		const installments = [
			{ sequence: 1, dueDate: '2026-11-05', amount: 33_333 },
			{ sequence: 2, dueDate: '2026-12-05', amount: 33_334 }
		];
		expect(toScheduleFormValues(installments).installmentAmount).toBe('');
	});
});
