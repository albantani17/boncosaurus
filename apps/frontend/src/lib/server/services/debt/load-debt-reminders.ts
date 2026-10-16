import { ApiError } from '@boncosaurus/shared';
import type { DebtReminder } from '../../../types/api.types';

type Client = { get<T>(path: string): Promise<T> };

/** Reminders are a nice-to-have on every page, so a failure shows none instead of breaking the app. */
export async function loadDebtReminders(client: Client): Promise<DebtReminder[]> {
	try {
		return await client.get<DebtReminder[]>('/debts/reminders');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw error;
		return [];
	}
}
