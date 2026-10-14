import type { Handle } from '@sveltejs/kit/hooks';
import {
	ACCESS_COOKIE,
	REFRESH_COOKIE,
	clearSessionCookies,
	setSessionCookies
} from '#lib/server/services/session-cookies.ts';
import { cookieSecure, refreshCoordinator } from '#lib/server/services/session-runtime.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, locals } = event;
	locals.accessToken = cookies.get(ACCESS_COOKIE) ?? null;

	const refreshToken = cookies.get(REFRESH_COOKIE);
	if (!locals.accessToken && refreshToken) {
		try {
			const session = await refreshCoordinator.refresh(refreshToken);
			setSessionCookies(cookies, session, cookieSecure());
			locals.accessToken = session.accessToken;
		} catch {
			clearSessionCookies(cookies);
		}
	}

	return resolve(event);
};
