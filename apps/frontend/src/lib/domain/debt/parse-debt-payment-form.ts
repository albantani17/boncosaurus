import type { CreateDebtPaymentBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseLocalDatetime } from '../../utils/local-datetime';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';
import { readTzOffset } from '../../utils/read-tz-offset';

const MAX_NOTE_LENGTH = 500;

export function parseDebtPaymentForm(data: FormData, fallbackOffsetMinutes: number): FormResult<CreateDebtPaymentBody> {
	const accountId = readFormText(data, 'accountId');
	const amount = parseAmountInput(readFormText(data, 'amount'));
	const paidAt = parseLocalDatetime(readFormText(data, 'paidAt'), readTzOffset(data, fallbackOffsetMinutes));
	const extraCategoryId = readFormText(data, 'extraCategoryId');
	const note = readFormText(data, 'note');

	if (!accountId) return { ok: false, message: 'Pilih akun pembayaran.' };
	if (amount === null) return { ok: false, message: 'Jumlah harus angka bulat lebih dari 0.' };
	if (!paidAt) return { ok: false, message: 'Tanggal dan waktu tidak valid.' };
	if (note.length > MAX_NOTE_LENGTH) return { ok: false, message: 'Catatan maksimal 500 karakter.' };

	return {
		ok: true,
		value: {
			accountId,
			amount,
			paidAt: paidAt.toISOString(),
			extraCategoryId: extraCategoryId || null,
			note: note || null
		}
	};
}
