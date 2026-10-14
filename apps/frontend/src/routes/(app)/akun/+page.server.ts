import { backendFor } from '#lib/server/api/backend.ts';
import { requireRecordId } from '#lib/server/services/require-record-id.ts';
import { formFailure, runBackendAction } from '#lib/server/services/run-backend-action.ts';
import type { Account } from '#lib/types/api.types.ts';
import { parseAccountForm } from '#lib/utils/parse-account-form.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	return { accounts: await client.get<Account[]>('/accounts') };
};

export const actions: Actions = {
	create: async (event) => {
		const form = parseAccountForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request('/accounts', { method: 'POST', body: form.value })
		);
		return outcome.ok ? { message: 'Akun ditambahkan.' } : outcome.failure;
	},

	update: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const form = parseAccountForm(data);
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(
			event,
			(client) => client.request(`/accounts/${record.id}`, { method: 'PATCH', body: form.value }),
			{ ACCOUNT_HAS_TRANSACTIONS: 'Mata uang tidak bisa diubah karena akun ini sudah punya transaksi.' }
		);
		return outcome.ok ? { message: 'Akun disimpan.' } : outcome.failure;
	},

	archive: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const isArchived = data.get('archived') === 'true';

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/accounts/${record.id}`, { method: 'PATCH', body: { isArchived } })
		);
		return outcome.ok ? { message: isArchived ? 'Akun diarsipkan.' : 'Akun dipulihkan.' } : outcome.failure;
	},

	delete: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(
			event,
			(client) => client.request(`/accounts/${record.id}`, { method: 'DELETE' }),
			{ ACCOUNT_HAS_TRANSACTIONS: 'Akun ini sudah punya transaksi, jadi tidak bisa dihapus. Arsipkan saja.' }
		);
		return outcome.ok ? { message: 'Akun dihapus.' } : outcome.failure;
	}
};
