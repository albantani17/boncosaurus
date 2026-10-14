import { describe, expect, test } from 'bun:test';
import { parsePasswordForm, parseProfileForm } from './parse-profile-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

describe('parseProfileForm', () => {
	test('parses name and lowercases the email', () => {
		expect(parseProfileForm(formWith({ name: ' Budi ', email: 'Budi@Mail.com' }))).toEqual({
			ok: true,
			value: { name: 'Budi', email: 'budi@mail.com' }
		});
	});

	test('passes the current password along when given', () => {
		expect(parseProfileForm(formWith({ name: 'B', email: 'b@m.id', currentPassword: 'x' }))).toMatchObject({
			value: { currentPassword: 'x' }
		});
	});

	test('rejects an empty name', () => {
		expect(parseProfileForm(formWith({ name: '', email: 'b@m.id' }))).toMatchObject({ ok: false });
	});

	test('rejects an invalid email', () => {
		expect(parseProfileForm(formWith({ name: 'B', email: 'budi' }))).toMatchObject({ ok: false });
	});
});

describe('parsePasswordForm', () => {
	const valid = { currentPassword: 'old-pass', newPassword: 'new-pass-1', confirmPassword: 'new-pass-1' };

	test('accepts matching passwords of sufficient length', () => {
		expect(parsePasswordForm(formWith(valid))).toEqual({
			ok: true,
			value: { currentPassword: 'old-pass', newPassword: 'new-pass-1' }
		});
	});

	test('requires the current password', () => {
		expect(parsePasswordForm(formWith({ ...valid, currentPassword: '' }))).toMatchObject({ ok: false });
	});

	test('rejects a new password shorter than eight characters', () => {
		expect(
			parsePasswordForm(formWith({ ...valid, newPassword: 'short', confirmPassword: 'short' }))
		).toEqual({ ok: false, message: 'Kata sandi baru minimal 8 karakter.' });
	});

	test('accepts exactly eight characters', () => {
		expect(
			parsePasswordForm(formWith({ ...valid, newPassword: '12345678', confirmPassword: '12345678' }))
		).toMatchObject({ ok: true });
	});

	test('rejects a confirmation that does not match', () => {
		expect(parsePasswordForm(formWith({ ...valid, confirmPassword: 'different' }))).toEqual({
			ok: false,
			message: 'Konfirmasi kata sandi tidak sama.'
		});
	});
});
