import { describe, expect, test } from 'bun:test';
import { parseAccountForm } from './parse-account-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries({ name: 'BCA', type: 'bank', currency: 'IDR', ...fields })) {
		data.set(key, value);
	}
	return data;
};

describe('parseAccountForm', () => {
	test('parses a complete form', () => {
		expect(parseAccountForm(formWith({ initialBalance: '1.500.000' }))).toEqual({
			ok: true,
			value: { name: 'BCA', type: 'bank', currency: 'IDR', initialBalance: 1500000 }
		});
	});

	test('defaults an empty initial balance to zero', () => {
		expect(parseAccountForm(formWith({ initialBalance: '' }))).toMatchObject({ value: { initialBalance: 0 } });
	});

	test('allows a negative balance for debts like credit cards', () => {
		expect(parseAccountForm(formWith({ initialBalance: '-200000' }))).toMatchObject({
			value: { initialBalance: -200000 }
		});
	});

	test('uppercases the currency code', () => {
		expect(parseAccountForm(formWith({ currency: 'usd' }))).toMatchObject({ value: { currency: 'USD' } });
	});

	test('rejects a missing name', () => {
		expect(parseAccountForm(formWith({ name: ' ' }))).toEqual({ ok: false, message: 'Nama akun wajib diisi.' });
	});

	test('rejects an unknown account type', () => {
		expect(parseAccountForm(formWith({ type: 'piggy' }))).toMatchObject({ ok: false });
	});

	test('rejects a currency that is not three letters', () => {
		expect(parseAccountForm(formWith({ currency: 'RUPIAH' }))).toMatchObject({ ok: false });
	});

	test('rejects a non-numeric balance', () => {
		expect(parseAccountForm(formWith({ initialBalance: 'banyak' }))).toMatchObject({ ok: false });
	});
});
