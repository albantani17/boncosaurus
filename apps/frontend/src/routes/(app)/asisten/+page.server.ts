import { redirect } from '@sveltejs/kit';
import { runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import type { Conversation } from '#lib/types/ai.types.ts';
import { isUuid } from '#lib/utils/is-uuid.ts';
import { readFormText } from '#lib/utils/read-form-text.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	new: async (event) => {
		const providerId = readFormText(await event.request.formData(), 'providerId');
		const outcome = await runBackendAction(event, async (client) => {
			return client.send<Conversation>('/chat/conversations', {
				method: 'POST',
				body: providerId && isUuid(providerId) ? { providerId } : {}
			});
		});
		if (!outcome.ok) return outcome.failure;
		redirect(303, `/asisten/${outcome.result.id}`);
	}
};
