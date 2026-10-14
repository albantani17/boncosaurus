import { ApiError } from '#lib/server/api/api-error.ts';
import { requireRecordId } from '#lib/server/services/require-record-id.ts';
import { formFailure, runBackendAction } from '#lib/server/services/run-backend-action.ts';
import { parseAiProviderForm } from '#lib/utils/parse-ai-provider-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	return { canManage: workspace.role === 'owner' || workspace.role === 'admin' };
};

export const actions: Actions = {
	create: async (event) => {
		const form = parseAiProviderForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);
		const { clearApiKey: _ignored, ...body } = form.value;

		const outcome = await runBackendAction(event, (client) =>
			client.request('/ai/providers', { method: 'POST', body })
		);
		return outcome.ok ? { message: 'Provider AI ditambahkan.' } : outcome.failure;
	},

	update: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const form = parseAiProviderForm(data);
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/ai/providers/${record.id}`, { method: 'PATCH', body: form.value })
		);
		return outcome.ok ? { message: 'Provider AI disimpan.' } : outcome.failure;
	},

	setDefault: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/ai/providers/${record.id}/default`, { method: 'POST' })
		);
		return outcome.ok ? { message: 'Provider default diganti.' } : outcome.failure;
	},

	test: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/ai/providers/${record.id}/test`, { method: 'POST' }).then(
				() => null,
				(error) => {
					// Show the provider's own reason (bad key, unknown model, …) instead of a generic message.
					if (error instanceof ApiError && error.code === 'AI_PROVIDER_FAILED') return error.message;
					throw error;
				}
			)
		);
		if (!outcome.ok) return outcome.failure;
		return outcome.result === null
			? { message: 'Koneksi berhasil. Provider siap dipakai.' }
			: formFailure(`Koneksi gagal: ${outcome.result}`);
	},

	delete: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/ai/providers/${record.id}`, { method: 'DELETE' })
		);
		return outcome.ok ? { message: 'Provider AI dihapus.' } : outcome.failure;
	}
};
