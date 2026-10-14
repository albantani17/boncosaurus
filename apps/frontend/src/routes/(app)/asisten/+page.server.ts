import { redirect } from '@sveltejs/kit';
import { backendFor } from '#lib/server/api/backend.ts';
import { loadAiProviders } from '#lib/server/services/load-ai-providers.ts';
import { runBackendAction } from '#lib/server/services/run-backend-action.ts';
import type { Conversation } from '#lib/types/ai.types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent, depends }) => {
	depends('app:conversations');
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const ai = await loadAiProviders(client);
	return {
		...ai,
		conversations: ai.aiReady ? await client.get<Conversation[]>('/chat/conversations') : []
	};
};

export const actions: Actions = {
	new: async (event) => {
		const outcome = await runBackendAction(event, async (client) => {
			const response = await client.request('/chat/conversations', { method: 'POST', body: {} });
			return (await response.json()) as Conversation;
		});
		if (!outcome.ok) return outcome.failure;
		redirect(303, `/asisten/${outcome.result.id}`);
	}
};
