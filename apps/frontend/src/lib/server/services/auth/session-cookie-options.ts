const ACCESS_COOKIE_SAFETY_MARGIN_SECONDS = 30;

export const accessCookieMaxAge = (expiresInSeconds: number) =>
	Math.max(expiresInSeconds - ACCESS_COOKIE_SAFETY_MARGIN_SECONDS, 1);

export function resolveCookieSecure(cookieSecure: string | undefined, nodeEnv: string | undefined) {
	const configured = cookieSecure?.trim();
	return (configured || String(nodeEnv === 'production')) === 'true';
}
