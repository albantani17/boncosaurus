import { fail, redirect } from '@sveltejs/kit';
import { ApiError } from '@boncosaurus/shared';
import { setSessionCookies } from '#lib/server/services/auth/session-cookies.ts';
import { authServiceFor, cookieSecure } from '#lib/server/services/auth/session-runtime.ts';
import { validateLoginForm } from '#lib/domain/auth/validate-login-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.accessToken) redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request, fetch, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();

		const form = validateLoginForm(data);
		if (!form.ok) return fail(400, { email, message: form.message });

		try {
			const session = await authServiceFor(fetch).login(form.value.email, form.value.password);
			setSessionCookies(cookies, session, cookieSecure());
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				return fail(400, { email, message: 'Email atau kata sandi salah' });
			}
			return fail(503, { email, message: 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.' });
		}

		redirect(303, '/dashboard');
	}
};
