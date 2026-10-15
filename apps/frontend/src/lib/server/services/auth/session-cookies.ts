import type { Cookies } from '@sveltejs/kit';
import { accessCookieMaxAge } from './session-cookie-options';
import type { Session } from './refresh-coordinator';

export const ACCESS_COOKIE = 'bs_access';
export const REFRESH_COOKIE = 'bs_refresh';

const baseOptions = (secure: boolean) => ({
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure
});

export function setSessionCookies(cookies: Cookies, session: Session, secure: boolean) {
	cookies.set(ACCESS_COOKIE, session.accessToken, {
		...baseOptions(secure),
		maxAge: accessCookieMaxAge(session.expiresIn)
	});
	cookies.set(REFRESH_COOKIE, session.refreshToken, {
		...baseOptions(secure),
		maxAge: session.refreshMaxAgeSeconds
	});
}

export function clearSessionCookies(cookies: Cookies) {
	cookies.delete(ACCESS_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}
