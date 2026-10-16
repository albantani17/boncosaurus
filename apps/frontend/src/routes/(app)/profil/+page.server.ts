import { createAuthService } from '#lib/server/services/auth/auth.service.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import { setSessionCookies } from '#lib/server/services/auth/session-cookies.ts';
import { cookieSecure } from '#lib/server/services/auth/session-runtime.ts';
import { parsePasswordForm, parseProfileForm } from '#lib/domain/profile/parse-profile-form.ts';
import { backendFor } from '#lib/server/api/backend.ts';
import type { PushConfig } from '#lib/types/api.types.ts';
import type { Actions, PageServerLoad } from './$types';

const PUSH_OFF: PushConfig = { enabled: false, publicKey: null };

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const pushConfig = await backendFor(fetch, { accessToken: locals.accessToken })
		.get<PushConfig>('/push/config')
		.catch(() => PUSH_OFF);
	return { pushConfig };
};

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
