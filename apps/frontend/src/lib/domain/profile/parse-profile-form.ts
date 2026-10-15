import { type ChangePasswordBody, MIN_PASSWORD_LENGTH, type UpdateProfileBody } from '@boncosaurus/shared';
import type { FormResult } from '../../types/form.types';
import { readFormText } from '../../utils/read-form-text';

export function parseProfileForm(data: FormData): FormResult<UpdateProfileBody> {
	const name = readFormText(data, 'name');
	const email = readFormText(data, 'email').toLowerCase();
	const currentPassword = String(data.get('currentPassword') ?? '');

	if (!name) return { ok: false, message: 'Nama wajib diisi.' };
	if (!email.includes('@')) return { ok: false, message: 'Format email tidak valid.' };
	return { ok: true, value: { name, email, ...(currentPassword ? { currentPassword } : {}) } };
}

export function parsePasswordForm(data: FormData): FormResult<ChangePasswordBody> {
	const currentPassword = String(data.get('currentPassword') ?? '');
	const newPassword = String(data.get('newPassword') ?? '');
	const confirmPassword = String(data.get('confirmPassword') ?? '');

	if (!currentPassword) return { ok: false, message: 'Masukkan kata sandi saat ini.' };
	if (newPassword.length < MIN_PASSWORD_LENGTH) {
		return { ok: false, message: `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.` };
	}
	if (newPassword !== confirmPassword) return { ok: false, message: 'Konfirmasi kata sandi tidak sama.' };
	return { ok: true, value: { currentPassword, newPassword } };
}
