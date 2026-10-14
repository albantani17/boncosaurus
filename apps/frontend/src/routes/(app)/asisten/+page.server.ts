import { redirect } from '@sveltejs/kit';
import { runBackendAction } from '#lib/server/services/run-backend-action.ts';
import type { Conversation } from '#lib/types/ai.types.ts';
import { isUuid } from '#lib/utils/is-uuid.ts';
import { readFormText } from '#lib/utils/read-form-text.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	new: async (event) => {
		const providerId = readFormText(await event.request.formData(), 'providerId');
		const outcome = await runBackendAction(event, async (client) => {
			const response = await client.request('/chat/conversations', {
				method: 'POST',
				body: providerId && isUuid(providerId) ? { providerId } : {}
			});
			return (await response.json()) as Conversation;
		});
		if (!outcome.ok) return outcome.failure;
		redirect(303, `/asisten/${outcome.result.id}`);
	}
};
