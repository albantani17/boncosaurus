import type { Account } from '../types/api.types';
import type { FormResult } from '../types/form.types';
import { parseAmountInput } from './parse-amount-input';
import { readFormText } from './read-form-text';

export type AccountInput = Pick<Account, 'name' | 'type' | 'currency' | 'initialBalance'>;

export const ACCOUNT_TYPES: Account['type'][] = ['cash', 'bank', 'ewallet', 'credit_card', 'investment', 'other'];
const CURRENCY_CODE = /^[A-Z]{3}$/;

export function parseAccountForm(data: FormData): FormResult<AccountInput> {
	const name = readFormText(data, 'name');
	const type = readFormText(data, 'type') as Account['type'];
	const currency = readFormText(data, 'currency').toUpperCase();
	const rawBalance = readFormText(data, 'initialBalance');
	const initialBalance = rawBalance === '' ? 0 : parseAmountInput(rawBalance, { allowZero: true, allowNegative: true });

	if (!name) return { ok: false, message: 'Nama akun wajib diisi.' };
	if (!ACCOUNT_TYPES.includes(type)) return { ok: false, message: 'Pilih jenis akun.' };
	if (!CURRENCY_CODE.test(currency)) return { ok: false, message: 'Mata uang harus 3 huruf, misalnya IDR.' };
	if (initialBalance === null) return { ok: false, message: 'Saldo awal harus berupa angka bulat.' };
	return { ok: true, value: { name, type, currency, initialBalance } };
}
