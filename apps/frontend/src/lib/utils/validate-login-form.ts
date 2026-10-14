export type LoginForm = { email: string; password: string };
export type LoginFormResult = { ok: true; value: LoginForm } | { ok: false; message: string };

export function validateLoginForm(data: FormData): LoginFormResult {
	const email = String(data.get('email') ?? '').trim();
	const password = String(data.get('password') ?? '');
	if (!email) return { ok: false, message: 'Email wajib diisi' };
	if (!email.includes('@')) return { ok: false, message: 'Format email tidak valid' };
	if (!password) return { ok: false, message: 'Kata sandi wajib diisi' };
	return { ok: true, value: { email, password } };
}
