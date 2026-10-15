import { describe, expect, test } from 'bun:test';
import { validateLoginForm } from './validate-login-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

describe('validateLoginForm', () => {
	test('accepts a filled form and trims the email', () => {
		const result = validateLoginForm(formWith({ email: ' a@b.id ', password: 'rahasia' }));

		expect(result).toEqual({ ok: true, value: { email: 'a@b.id', password: 'rahasia' } });
	});

	test('rejects an empty email', () => {
		expect(validateLoginForm(formWith({ email: '  ', password: 'x' }))).toEqual({
			ok: false,
			message: 'Email wajib diisi'
		});
	});

	test('rejects an email without @', () => {
		expect(validateLoginForm(formWith({ email: 'abc', password: 'x' }))).toMatchObject({ ok: false });
	});

	test('rejects an empty password', () => {
		expect(validateLoginForm(formWith({ email: 'a@b.id', password: '' }))).toEqual({
			ok: false,
			message: 'Kata sandi wajib diisi'
		});
	});

	test('does not trim the password', () => {
		const result = validateLoginForm(formWith({ email: 'a@b.id', password: ' x ' }));

		expect(result).toMatchObject({ ok: true, value: { password: ' x ' } });
	});
});
