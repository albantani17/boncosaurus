import { backendFor } from '#lib/server/api/backend.ts';
import { loadAiProviders } from '#lib/server/services/load-ai-providers.ts';
import type { Conversation } from '#lib/types/ai.types.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, fetch, parent, depends }) => {
	depends('app:conversations');
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const ai = await loadAiProviders(client);
	return {
		...ai,
		conversations: ai.aiReady ? await client.get<Conversation[]>('/chat/conversations') : []
	};
};
