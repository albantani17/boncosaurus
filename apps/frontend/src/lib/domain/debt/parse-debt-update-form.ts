import type { UpdateDebtBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';
import { parseReminderDays } from './parse-reminder-days';
import { parseScheduleFields } from './parse-schedule-fields';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE_LENGTH = 120;

export function parseDebtUpdateForm(data: FormData): FormResult<UpdateDebtBody> {
	const title = readFormText(data, 'title');
	const principal = parseAmountInput(readFormText(data, 'principal'));
	const dueDate = readFormText(data, 'dueDate');
	const note = readFormText(data, 'note');
	const schedule = parseScheduleFields(data);
	const reminderDays = parseReminderDays(readFormText(data, 'reminderDays'));

	if (!title) return { ok: false, message: 'Judul wajib diisi.' };
	if (title.length > MAX_TITLE_LENGTH) return { ok: false, message: 'Judul maksimal 120 karakter.' };
	if (principal === null) return { ok: false, message: 'Jumlah harus angka bulat lebih dari 0.' };
	if (dueDate && !CALENDAR_DATE.test(dueDate)) return { ok: false, message: 'Tanggal jatuh tempo tidak valid.' };
	if (!schedule.ok) return schedule;
	if (!reminderDays.ok) return reminderDays;

	return {
		ok: true,
		value: {
			title,
			principal,
			dueDate: schedule.value ? null : dueDate || null,
			note: note || null,
			schedule: schedule.value,
			...(reminderDays.value === null ? {} : { reminderDays: reminderDays.value })
		}
	};
}
