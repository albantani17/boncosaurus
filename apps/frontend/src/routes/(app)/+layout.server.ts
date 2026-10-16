import { redirect } from '@sveltejs/kit';
import { ApiError } from '@boncosaurus/shared';
import { backendFor } from '#lib/server/api/backend.ts';
import { clearSessionCookies } from '#lib/server/services/auth/session-cookies.ts';
import { loadDebtReminders } from '#lib/server/services/debt/load-debt-reminders.ts';
import type { Profile } from '#lib/types/api.types.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, fetch, cookies }) => {
	if (!locals.accessToken) redirect(303, '/login');

	try {
		const profile = await backendFor(fetch, { accessToken: locals.accessToken }).get<Profile>('/auth/me');
		const workspace = profile.workspaces[0];
		if (!workspace) redirect(303, '/login');
		const reminders = await loadDebtReminders(
			backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id })
		);
		return { user: profile.user, workspace, reminders };
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			clearSessionCookies(cookies);
			redirect(303, '/login');
		}
		throw error;
	}
};
