import type { InstallmentScheduleBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_INSTALLMENTS = 120;

/** Reads the optional installment schedule; `null` when the schedule box is unchecked. */
export function parseScheduleFields(data: FormData): FormResult<InstallmentScheduleBody | null> {
	if (data.get('withSchedule') !== 'on') return { ok: true, value: null };

	const firstDueDate = readFormText(data, 'firstDueDate');
	const count = Number(readFormText(data, 'installmentCount'));
	const rawAmount = readFormText(data, 'installmentAmount');
	const installmentAmount = rawAmount ? parseAmountInput(rawAmount) : null;

	if (!CALENDAR_DATE.test(firstDueDate)) return { ok: false, message: 'Isi tanggal jatuh tempo cicilan pertama.' };
	if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
		return { ok: false, message: `Jumlah cicilan harus 1 sampai ${MAX_INSTALLMENTS}.` };
	}
	if (rawAmount && installmentAmount === null) return { ok: false, message: 'Nominal per cicilan harus angka bulat lebih dari 0.' };
	return { ok: true, value: { firstDueDate, count, installmentAmount } };
}
