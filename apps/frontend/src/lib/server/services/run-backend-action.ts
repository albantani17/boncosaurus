import { type ActionFailure, type RequestEvent, fail, redirect } from '@sveltejs/kit';
import { type ErrorMessages, describeApiError } from '../../utils/describe-api-error';
import { ApiError } from '../api/api-error';
import { backendFor } from '../api/backend';
import type { BackendClient } from '../api/create-backend-client';
import { clearSessionCookies } from './session-cookies';

export type ActionMessage = { message: string };
export type ActionOutcome<T> = { ok: true; result: T } | { ok: false; failure: ActionFailure<ActionMessage> };

const UNREACHABLE_MESSAGE = 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.';

export const formFailure = (message: string) => fail(400, { message });

// Workspace-scoped calls omit X-Workspace-Id: the backend then uses the user's first workspace,
// which is the same workspace (app)/+layout.server.ts shows.
export async function runBackendAction<T>(
	event: Pick<RequestEvent, 'fetch' | 'locals' | 'cookies'>,
	run: (client: BackendClient) => Promise<T>,
	messages: ErrorMessages = {}
): Promise<ActionOutcome<T>> {
	if (!event.locals.accessToken) redirect(303, '/login');

	try {
		return { ok: true, result: await run(backendFor(event.fetch, { accessToken: event.locals.accessToken })) };
	} catch (error) {
		if (!(error instanceof ApiError)) {
			return { ok: false, failure: fail(503, { message: UNREACHABLE_MESSAGE }) };
		}
		if (error.status === 401 && error.code !== 'INVALID_CREDENTIALS') {
			clearSessionCookies(event.cookies);
			redirect(303, '/login');
		}
		const status = error.status >= 500 ? 502 : error.status;
		return { ok: false, failure: fail(status, { message: describeApiError(error.code, messages) }) };
	}
}
