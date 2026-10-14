import type { PublicUser } from '#lib/types/api.types.ts';
import { ApiError } from '../api/api-error';
import type { BackendClient } from '../api/create-backend-client';
import { readSetCookie } from '../utils/read-set-cookie';
import type { Session } from './refresh-coordinator';

const BACKEND_REFRESH_COOKIE = 'refresh_token';
const DEFAULT_REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type SessionBody = { accessToken: string; expiresIn: number };

async function readSession(response: Response): Promise<Session> {
	const body = (await response.json()) as SessionBody;
	const cookie = readSetCookie(response.headers.getSetCookie(), BACKEND_REFRESH_COOKIE);
	if (!cookie?.value) throw new ApiError(502, 'MISSING_REFRESH_TOKEN', 'Backend did not issue a refresh token');
	return {
		accessToken: body.accessToken,
		expiresIn: body.expiresIn,
		refreshToken: cookie.value,
		refreshMaxAgeSeconds: cookie.maxAge ?? DEFAULT_REFRESH_MAX_AGE_SECONDS
	};
}

const asRefreshCookie = (refreshToken: string) => ({ cookie: `${BACKEND_REFRESH_COOKIE}=${refreshToken}` });

export function createAuthService(client: Pick<BackendClient, 'request'>) {
	return {
		async login(email: string, password: string): Promise<Session & { user: PublicUser }> {
			const response = await client.request('/auth/login', { method: 'POST', body: { email, password } });
			const user = ((await response.clone().json()) as { user: PublicUser }).user;
			return { ...(await readSession(response)), user };
		},

		async refresh(refreshToken: string): Promise<Session> {
			const response = await client.request('/auth/refresh', {
				method: 'POST',
				headers: asRefreshCookie(refreshToken)
			});
			return readSession(response);
		},

		async updateProfile(input: { name: string; email: string; currentPassword?: string }): Promise<PublicUser> {
			const response = await client.request('/auth/me', { method: 'PATCH', body: input });
			return (await response.json()) as PublicUser;
		},

		async changePassword(currentPassword: string, newPassword: string): Promise<Session> {
			const response = await client.request('/auth/me/password', {
				method: 'POST',
				body: { currentPassword, newPassword }
			});
			return readSession(response);
		},

		async logout(refreshToken: string): Promise<void> {
			await client
				.request('/auth/logout', { method: 'POST', headers: asRefreshCookie(refreshToken) })
				.catch(() => undefined);
		}
	};
}
