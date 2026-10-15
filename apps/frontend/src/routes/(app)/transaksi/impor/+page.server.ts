import { backendFor } from '#lib/server/api/backend.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import type { Account, Category } from '#lib/types/api.types.ts';
import type { ImportPreview, ImportResult } from '#lib/types/import.types.ts';
import { parseImportCommitForm, parseImportUploadForm } from '#lib/domain/import/parse-import-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const [accounts, categories] = await Promise.all([
		client.get<Account[]>('/accounts'),
		client.get<Category[]>('/categories')
	]);
	return {
		accounts: accounts.filter((account) => !account.isArchived),
		categories: categories.filter((category) => !category.isArchived)
	};
};

export const actions: Actions = {
	preview: async (event) => {
		const form = parseImportUploadForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, async (client) => {
			return client.send<ImportPreview>('/imports/preview', { method: 'POST', body: form.value });
		});
		return outcome.ok ? { preview: outcome.result } : outcome.failure;
	},

	commit: async (event) => {
		const form = parseImportCommitForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, async (client) => {
			return client.send<ImportResult>('/imports/commit', { method: 'POST', body: form.value });
		});
		return outcome.ok ? { imported: outcome.result } : outcome.failure;
	}
};
