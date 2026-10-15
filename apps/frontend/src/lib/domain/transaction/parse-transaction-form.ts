import type { TransactionType } from '../../types/api.types';
import type { FormResult } from '../../types/form.types';
import { parseLocalDatetime } from '../../utils/local-datetime';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';

export type TransactionInput = {
	type: TransactionType;
	accountId: string;
	toAccountId: string | null;
	categoryId: string | null;
	amount: number;
	toAmount: number | null;
	fee: number | null;
	occurredAt: string;
	note: string | null;
};

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense', 'transfer'];
const MAX_NOTE_LENGTH = 500;

export function parseTransactionForm(data: FormData, fallbackOffsetMinutes: number): FormResult<TransactionInput> {
	const type = readFormText(data, 'type') as TransactionType;
	const accountId = readFormText(data, 'accountId');
	const toAccountId = readFormText(data, 'toAccountId');
	const categoryId = readFormText(data, 'categoryId');
	const rawToAmount = readFormText(data, 'toAmount');
	const rawFee = readFormText(data, 'fee');
	const note = readFormText(data, 'note');
	const offsetInput = Number(readFormText(data, 'tzOffset'));
	const offsetMinutes = readFormText(data, 'tzOffset') !== '' && Number.isFinite(offsetInput) ? offsetInput : fallbackOffsetMinutes;

	const amount = parseAmountInput(readFormText(data, 'amount'));
	const occurredAt = parseLocalDatetime(readFormText(data, 'occurredAt'), offsetMinutes);
	const isTransfer = type === 'transfer';
	const toAmount = isTransfer && rawToAmount ? parseAmountInput(rawToAmount) : null;
	const fee = isTransfer && rawFee ? parseAmountInput(rawFee) : null;

	if (!TRANSACTION_TYPES.includes(type)) return { ok: false, message: 'Pilih jenis transaksi.' };
	if (amount === null) return { ok: false, message: 'Jumlah harus angka bulat lebih dari 0.' };
	if (!accountId) return { ok: false, message: 'Pilih akun.' };
	if (isTransfer && !toAccountId) return { ok: false, message: 'Pilih akun tujuan transfer.' };
	if (isTransfer && toAccountId === accountId) return { ok: false, message: 'Akun asal dan tujuan tidak boleh sama.' };
	if (isTransfer && rawToAmount && toAmount === null) {
		return { ok: false, message: 'Jumlah diterima harus angka bulat lebih dari 0.' };
	}
	if (isTransfer && rawFee && fee === null) return { ok: false, message: 'Biaya admin harus angka bulat lebih dari 0.' };
	if (!occurredAt) return { ok: false, message: 'Tanggal dan waktu tidak valid.' };
	if (note.length > MAX_NOTE_LENGTH) return { ok: false, message: 'Catatan maksimal 500 karakter.' };

	return {
		ok: true,
		value: {
			type,
			accountId,
			toAccountId: isTransfer ? toAccountId : null,
			categoryId: isTransfer || !categoryId ? null : categoryId,
			amount,
			toAmount,
			fee,
			occurredAt: occurredAt.toISOString(),
			note: note || null
		}
	};
}
