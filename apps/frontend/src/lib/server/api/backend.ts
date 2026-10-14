import { API_URL } from '$app/env/private';
import { createBackendClient } from './create-backend-client';

type Options = { accessToken?: string | null; workspaceId?: string };

export const backendFor = (fetch: typeof globalThis.fetch, options: Options = {}) =>
	createBackendClient({ fetch, baseUrl: API_URL, ...options });
