import { createAuthService } from '#lib/server/services/auth.service.ts';
import { formFailure, runBackendAction } from '#lib/server/services/run-backend-action.ts';
import { setSessionCookies } from '#lib/server/services/session-cookies.ts';
import { cookieSecure } from '#lib/server/services/session-runtime.ts';
import { parsePasswordForm, parseProfileForm } from '#lib/utils/parse-profile-form.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	profile: async (event) => {
		const form = parseProfileForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) => createAuthService(client).updateProfile(form.value));
		return outcome.ok ? { message: 'Profil disimpan.' } : outcome.failure;
	},

	password: async (event) => {
		const form = parsePasswordForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			createAuthService(client).changePassword(form.value.currentPassword, form.value.newPassword)
		);
		if (!outcome.ok) return outcome.failure;

		setSessionCookies(event.cookies, outcome.result, cookieSecure());
		return { message: 'Kata sandi diganti. Perangkat lain sudah dikeluarkan.' };
	}
};
