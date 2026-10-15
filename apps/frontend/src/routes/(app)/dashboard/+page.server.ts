import { backendFor } from '#lib/server/api/backend.ts';
import { loadDashboard } from '#lib/server/services/dashboard/dashboard.service.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	return { dashboard: await loadDashboard({ client, baseCurrency: workspace.baseCurrency, now: new Date() }) };
};
