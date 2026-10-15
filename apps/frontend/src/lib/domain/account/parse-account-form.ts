import { ACCOUNT_TYPES, type AccountType, type CreateAccountBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { parseAmountInput } from '../../utils/parse-amount-input';
import { readFormText } from '../../utils/read-form-text';

const CURRENCY_CODE = /^[A-Z]{3}$/;

export function parseAccountForm(data: FormData): FormResult<CreateAccountBody> {
	const name = readFormText(data, 'name');
	const type = readFormText(data, 'type') as AccountType;
	const currency = readFormText(data, 'currency').toUpperCase();
	const rawBalance = readFormText(data, 'initialBalance');
	const initialBalance = rawBalance === '' ? 0 : parseAmountInput(rawBalance, { allowZero: true, allowNegative: true });

	if (!name) return { ok: false, message: 'Nama akun wajib diisi.' };
	if (!ACCOUNT_TYPES.includes(type)) return { ok: false, message: 'Pilih jenis akun.' };
	if (!CURRENCY_CODE.test(currency)) return { ok: false, message: 'Mata uang harus 3 huruf, misalnya IDR.' };
	if (initialBalance === null) return { ok: false, message: 'Saldo awal harus berupa angka bulat.' };
	return { ok: true, value: { name, type, currency, initialBalance } };
}
