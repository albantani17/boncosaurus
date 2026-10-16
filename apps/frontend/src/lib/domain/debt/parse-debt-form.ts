import {
	DEBT_DIRECTIONS,
	DEBT_SOURCE_TYPES,
	type CreateDebtBody,
	type DebtDirection,
	type DebtSourceType
} from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseLocalDatetime } from '../../utils/local-datetime';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';
import { readTzOffset } from '../../utils/read-tz-offset';
import { parseReminderDays } from './parse-reminder-days';
import { parseScheduleFields } from './parse-schedule-fields';

const CURRENCY_CODE = /^[A-Z]{3}$/;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE_LENGTH = 120;

const defaultTitle = (direction: DebtDirection, name: string) =>
	direction === 'payable' ? `Hutang ke ${name}` : `Piutang dari ${name}`;

export function parseDebtForm(data: FormData, fallbackOffsetMinutes: number): FormResult<CreateDebtBody> {
	const direction = readFormText(data, 'direction') as DebtDirection;
	const sourceType = readFormText(data, 'sourceType') as DebtSourceType;
	const moneyFlow = readFormText(data, 'moneyFlow');
	const counterpartyName = readFormText(data, 'counterpartyName');
	const title = readFormText(data, 'title');
	const principal = parseAmountInput(readFormText(data, 'principal'));
	const originatedAt = parseLocalDatetime(readFormText(data, 'originatedAt'), readTzOffset(data, fallbackOffsetMinutes));
	const accountId = readFormText(data, 'accountId');
	const categoryId = readFormText(data, 'categoryId');
	const currency = readFormText(data, 'currency').toUpperCase();
	const dueDate = readFormText(data, 'dueDate');
	const note = readFormText(data, 'note');
	const schedule = parseScheduleFields(data);
	const reminderDays = parseReminderDays(readFormText(data, 'reminderDays'));

	if (!DEBT_DIRECTIONS.includes(direction)) return { ok: false, message: 'Pilih hutang atau piutang.' };
	if (!DEBT_SOURCE_TYPES.includes(sourceType)) return { ok: false, message: 'Pilih sumber hutang.' };
	if (!counterpartyName) return { ok: false, message: 'Isi nama orang atau penyedia pinjamannya.' };
	if (principal === null) return { ok: false, message: 'Jumlah harus angka bulat lebih dari 0.' };
	if (!originatedAt) return { ok: false, message: 'Tanggal dan waktu tidak valid.' };
	if (title.length > MAX_TITLE_LENGTH) return { ok: false, message: 'Judul maksimal 120 karakter.' };
	if (dueDate && !CALENDAR_DATE.test(dueDate)) return { ok: false, message: 'Tanggal jatuh tempo tidak valid.' };
	if (!schedule.ok) return schedule;
	if (!reminderDays.ok) return reminderDays;

	const base = {
		direction,
		sourceType,
		counterpartyName,
		title: title || defaultTitle(direction, counterpartyName),
		principal,
		originatedAt: originatedAt.toISOString(),
		dueDate: schedule.value ? null : dueDate || null,
		note: note || null,
		schedule: schedule.value,
		reminderDays: reminderDays.value
	};

	if (moneyFlow === 'cash') {
		if (!accountId) return { ok: false, message: 'Pilih akun tempat uangnya keluar atau masuk.' };
		return { ok: true, value: { ...base, origin: 'cash', accountId } };
	}
	if (moneyFlow !== 'purchase') return { ok: false, message: 'Pilih apakah uangnya lewat akun.' };
	if (direction === 'receivable') return { ok: false, message: 'Piutang harus dicatat lewat akun atau dari transaksi patungan.' };
	if (!categoryId) return { ok: false, message: 'Pilih kategori barang atau jasa yang dibeli.' };
	if (!CURRENCY_CODE.test(currency)) return { ok: false, message: 'Mata uang harus 3 huruf, misalnya IDR.' };
	return { ok: true, value: { ...base, origin: 'purchase', categoryId, currency } };
}
