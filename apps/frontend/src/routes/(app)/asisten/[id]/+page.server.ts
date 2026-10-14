import { error, redirect } from '@sveltejs/kit';
import { ApiError } from '#lib/server/api/api-error.ts';
import { backendFor } from '#lib/server/api/backend.ts';
import { loadAiProviders } from '#lib/server/services/load-ai-providers.ts';
import { formFailure, runBackendAction } from '#lib/server/services/run-backend-action.ts';
import type { Conversation, ConversationWithMessages } from '#lib/types/ai.types.ts';
import type { Account, Category } from '#lib/types/api.types.ts';
import { isUuid } from '#lib/utils/is-uuid.ts';
import { parseDraftReference } from '#lib/utils/parse-draft-reference.ts';
import { readFormText } from '#lib/utils/read-form-text.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, params, parent, depends }) => {
	depends('app:conversations');
	if (!isUuid(params.id)) error(404, 'Percakapan tidak ditemukan');
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });

	const ai = await loadAiProviders(client);
	if (!ai.aiReady) redirect(303, '/asisten');

	try {
		const [conversation, conversations, accounts, categories] = await Promise.all([
			client.get<ConversationWithMessages>(`/chat/conversations/${params.id}`),
			client.get<Conversation[]>('/chat/conversations'),
			client.get<Account[]>('/accounts'),
			client.get<Category[]>('/categories')
		]);
		return { ...ai, conversation, conversations, accounts, categories };
	} catch (cause) {
		if (cause instanceof ApiError && cause.status === 404) error(404, 'Percakapan tidak ditemukan');
		throw cause;
	}
};

const conversationPath = (id: string) => `/chat/conversations/${id}`;

export const actions: Actions = {
	rename: async (event) => {
		const title = readFormText(await event.request.formData(), 'title');
		if (!title) return formFailure('Judul wajib diisi.');

		const outcome = await runBackendAction(event, (client) =>
			client.request(conversationPath(event.params.id), { method: 'PATCH', body: { title } })
		);
		return outcome.ok ? { message: 'Judul disimpan.' } : outcome.failure;
	},

	delete: async (event) => {
		const outcome = await runBackendAction(event, (client) =>
			client.request(conversationPath(event.params.id), { method: 'DELETE' })
		);
		if (!outcome.ok) return outcome.failure;
		redirect(303, '/asisten');
	},

	confirmDraft: async (event) => {
		const draft = parseDraftReference(await event.request.formData());
		if (!draft.ok) return formFailure(draft.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`${conversationPath(event.params.id)}/drafts/confirm`, { method: 'POST', body: draft.value })
		);
		return outcome.ok ? { message: 'Transaksi disimpan.' } : outcome.failure;
	},

	dismissDraft: async (event) => {
		const draft = parseDraftReference(await event.request.formData());
		if (!draft.ok) return formFailure(draft.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`${conversationPath(event.params.id)}/drafts/dismiss`, { method: 'POST', body: draft.value })
		);
		return outcome.ok ? { message: 'Draf diabaikan.' } : outcome.failure;
	}
};
