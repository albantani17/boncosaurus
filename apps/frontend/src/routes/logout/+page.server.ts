import { redirect } from '@sveltejs/kit';
import {
	REFRESH_COOKIE,
	clearSessionCookies
} from '#lib/server/services/auth/session-cookies.ts';
import { authServiceFor } from '#lib/server/services/auth/session-runtime.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ fetch, cookies }) => {
		const refreshToken = cookies.get(REFRESH_COOKIE);
		if (refreshToken) await authServiceFor(fetch).logout(refreshToken);
		clearSessionCookies(cookies);
		redirect(303, '/login');
	}
};
