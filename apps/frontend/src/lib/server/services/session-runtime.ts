import { COOKIE_SECURE } from '$app/env/private';
import { backendFor } from '#lib/server/api/backend.ts';
import { resolveCookieSecure } from '../utils/session-cookie-options';
import { createAuthService } from './auth.service';
import { createRefreshCoordinator } from './refresh-coordinator';

const REFRESH_GRACE_MS = 30_000;

export const cookieSecure = () => resolveCookieSecure(COOKIE_SECURE, process.env.NODE_ENV);

export const authServiceFor = (fetch: typeof globalThis.fetch) => createAuthService(backendFor(fetch));

export const refreshCoordinator = createRefreshCoordinator({
	refresh: (token) => authServiceFor(globalThis.fetch).refresh(token),
	now: () => Date.now(),
	graceMs: REFRESH_GRACE_MS
});
