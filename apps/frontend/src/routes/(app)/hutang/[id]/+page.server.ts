import { error, redirect } from '@sveltejs/kit';
import { ApiError } from '@boncosaurus/shared';
import { backendFor } from '#lib/server/api/backend.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import type { Account, Category, DebtDetail } from '#lib/types/api.types.ts';
import { isUuid } from '#lib/utils/is-uuid.ts';
import { readFormText } from '#lib/utils/read-form-text.ts';
import { toDateInputValue } from '#lib/utils/to-date-input-value.ts';
import { parseDebtPaymentForm } from '#lib/domain/debt/parse-debt-payment-form.ts';
import { parseDebtUpdateForm } from '#lib/domain/debt/parse-debt-update-form.ts';
import { DIRECTION_PARAM } from '#lib/domain/debt/read-debt-filters.ts';
import type { Actions, PageServerLoad } from './$types';

const NOT_FOUND = 'Hutang/piutang tidak ditemukan';

export const load: PageServerLoad = async ({ locals, fetch, params, parent }) => {
	if (!isUuid(params.id)) error(404, NOT_FOUND);
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });

	try {
		const [debt, accounts, categories] = await Promise.all([
			client.get<DebtDetail>(`/debts/${params.id}`),
			client.get<Account[]>('/accounts'),
			client.get<Category[]>('/categories')
		]);
		return { debt, accounts, categories, today: toDateInputValue(new Date()) };
	} catch (cause) {
		if (cause instanceof ApiError && cause.status === 404) error(404, NOT_FOUND);
		throw cause;
	}
};

const debtPath = (id: string) => `/debts/${id}`;

export const actions: Actions = {
	pay: async (event) => {
		const form = parseDebtPaymentForm(await event.request.formData(), new Date().getTimezoneOffset());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`${debtPath(event.params.id)}/payments`, { method: 'POST', body: form.value })
		);
		return outcome.ok ? { message: 'Pembayaran dicatat.' } : outcome.failure;
	},

	deletePayment: async (event) => {
		const paymentId = readFormText(await event.request.formData(), 'paymentId');
		if (!isUuid(paymentId)) return formFailure('Data tidak valid. Muat ulang halaman.');

		const outcome = await runBackendAction(event, (client) =>
			client.request(`${debtPath(event.params.id)}/payments/${paymentId}`, { method: 'DELETE' })
		);
		return outcome.ok ? { message: 'Pembayaran dihapus.' } : outcome.failure;
	},

	update: async (event) => {
		const form = parseDebtUpdateForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(debtPath(event.params.id), { method: 'PATCH', body: form.value })
		);
		return outcome.ok ? { message: 'Perubahan disimpan.' } : outcome.failure;
	},

	writeOff: async (event) => {
		const outcome = await runBackendAction(event, (client) =>
			client.request(`${debtPath(event.params.id)}/write-off`, { method: 'POST' })
		);
		return outcome.ok ? { message: 'Sisanya sudah diikhlaskan.' } : outcome.failure;
	},

	delete: async (event) => {
		const direction = readFormText(await event.request.formData(), 'direction');
		const outcome = await runBackendAction(event, (client) => client.request(debtPath(event.params.id), { method: 'DELETE' }));
		if (!outcome.ok) return outcome.failure;
		redirect(303, direction === 'receivable' ? `/hutang?arah=${DIRECTION_PARAM.receivable}` : '/hutang');
	}
};
