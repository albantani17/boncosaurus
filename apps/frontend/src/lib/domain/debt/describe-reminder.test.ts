import { describe, expect, test } from 'bun:test';
import type { DebtReminder } from '../../types/api.types';
import { describeReminder } from './describe-reminder';

const reminder = (overrides: Partial<DebtReminder>): DebtReminder => ({
	debtId: 'debt-1',
	title: 'Sepatu',
	counterpartyName: 'Kredivo',
	direction: 'payable',
	currency: 'IDR',
	amount: 105_000,
	dueDate: '2026-10-18',
	daysUntil: 2,
	...overrides
});

describe('describeReminder', () => {
	test('tells the user to pay a debt in a few days', () => {
		expect(describeReminder(reminder({}))).toEqual({ action: 'Bayar ke Kredivo', when: '2 hari lagi', isOverdue: false });
	});

	test('tells the user to collect a receivable', () => {
		expect(describeReminder(reminder({ direction: 'receivable', counterpartyName: 'Hani', daysUntil: 1 }))).toMatchObject({
			action: 'Tagih Hani',
			when: 'Besok'
		});
	});

	test('marks today and overdue reminders', () => {
		expect(describeReminder(reminder({ daysUntil: 0 })).when).toBe('Hari ini');
		expect(describeReminder(reminder({ daysUntil: -3 }))).toMatchObject({ when: 'Telat 3 hari', isOverdue: true });
	});
});
