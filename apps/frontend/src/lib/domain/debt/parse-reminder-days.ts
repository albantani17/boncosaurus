import type { FormResult } from '../../types/form.types';

export const MAX_REMINDER_DAYS = 60;

/** Days before a due date to start reminding; an empty field leaves the default (`null`). */
export function parseReminderDays(raw: string): FormResult<number | null> {
	if (raw === '') return { ok: true, value: null };
	const days = Number(raw);
	if (!Number.isInteger(days) || days < 0 || days > MAX_REMINDER_DAYS) {
		return { ok: false, message: `Pengingat harus 0 sampai ${MAX_REMINDER_DAYS} hari sebelum jatuh tempo.` };
	}
	return { ok: true, value: days };
}
