import { describe, expect, test } from 'bun:test';
import { ApiError } from '@boncosaurus/shared';
import type { DebtReminder } from '../../../types/api.types';
import { loadDebtReminders } from './load-debt-reminders';

const reminder: DebtReminder = {
	debtId: 'debt-1',
	title: 'Sepatu',
	counterpartyName: 'Kredivo',
	direction: 'payable',
	currency: 'IDR',
	amount: 105_000,
	dueDate: '2026-10-18',
	daysUntil: 2
};

const clientReturning = (result: () => Promise<unknown>) => ({ get: async <T>() => (await result()) as T });

describe('loadDebtReminders', () => {
	test('returns the reminders from the backend', async () => {
		expect(await loadDebtReminders(clientReturning(async () => [reminder]))).toEqual([reminder]);
	});

	test('shows no reminders when the backend fails', async () => {
		const failing = clientReturning(async () => {
			throw new ApiError(502, 'INTERNAL_ERROR', 'down');
		});
		expect(await loadDebtReminders(failing)).toEqual([]);
	});

	test('still signals an expired session', async () => {
		const expired = clientReturning(async () => {
			throw new ApiError(401, 'UNAUTHENTICATED', 'expired');
		});
		await expect(loadDebtReminders(expired)).rejects.toBeInstanceOf(ApiError);
	});
});
