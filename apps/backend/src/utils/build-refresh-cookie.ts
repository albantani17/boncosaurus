import type { AuthConfig } from './parse-auth-config';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/auth';

export function buildRefreshCookie(config: AuthConfig, value: string, maxAgeSeconds: number) {
  return {
    value,
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax' as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeSeconds
  };
}
