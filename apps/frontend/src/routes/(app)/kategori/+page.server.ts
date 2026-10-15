import { backendFor } from '#lib/server/api/backend.ts';
import { requireRecordId } from '#lib/server/actions/require-record-id.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import type { Category } from '#lib/types/api.types.ts';
import { parseCategoryForm, parseCategoryRenameForm } from '#lib/domain/category/parse-category-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	return { categories: await client.get<Category[]>('/categories') };
};

export const actions: Actions = {
	create: async (event) => {
		const form = parseCategoryForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request('/categories', { method: 'POST', body: form.value })
		);
		return outcome.ok ? { message: 'Kategori ditambahkan.' } : outcome.failure;
	},

	update: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const form = parseCategoryRenameForm(data);
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/categories/${record.id}`, { method: 'PATCH', body: form.value })
		);
		return outcome.ok ? { message: 'Kategori disimpan.' } : outcome.failure;
	},

	archive: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const isArchived = data.get('archived') === 'true';

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/categories/${record.id}`, { method: 'PATCH', body: { isArchived } })
		);
		return outcome.ok ? { message: isArchived ? 'Kategori diarsipkan.' : 'Kategori dipulihkan.' } : outcome.failure;
	},

	delete: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/categories/${record.id}`, { method: 'DELETE' })
		);
		return outcome.ok ? { message: 'Kategori dihapus.' } : outcome.failure;
	}
};
