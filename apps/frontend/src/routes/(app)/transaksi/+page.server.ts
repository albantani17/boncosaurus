import { backendFor } from '#lib/server/api/backend.ts';
import { requireRecordId } from '#lib/server/services/require-record-id.ts';
import { formFailure, runBackendAction } from '#lib/server/services/run-backend-action.ts';
import { loadTransactionPage } from '#lib/server/services/transaction-list.service.ts';
import type { PeriodSummary } from '#lib/types/api.types.ts';
import { formatMonthLabel } from '#lib/utils/format-month-label.ts';
import { parseTransactionForm } from '#lib/utils/parse-transaction-form.ts';
import { monthRangeOf, readTransactionFilters } from '#lib/utils/transaction-filters.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent, url }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const filters = readTransactionFilters(url.searchParams, new Date());
	const { from, to } = monthRangeOf(filters.month);
	const summaryQuery = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

	const [page, summary] = await Promise.all([
		loadTransactionPage(client, filters, 0),
		client.get<PeriodSummary>(`/reports/summary?${summaryQuery}`)
	]);
	const monthTotals = summary.totals.find((totals) => totals.currency === workspace.baseCurrency) ?? {
		currency: workspace.baseCurrency,
		income: 0,
		expense: 0,
		net: 0
	};

	return { ...page, filters, monthTotals, monthLabel: formatMonthLabel(from) };
};

const parseForm = (data: FormData) => parseTransactionForm(data, new Date().getTimezoneOffset());

export const actions: Actions = {
	create: async (event) => {
		const form = parseForm(await event.request.formData());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request('/transactions', { method: 'POST', body: form.value })
		);
		return outcome.ok ? { message: 'Transaksi dicatat.' } : outcome.failure;
	},

	update: async (event) => {
		const data = await event.request.formData();
		const record = requireRecordId(data);
		if (!record.ok) return record.failure;
		const form = parseForm(data);
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/transactions/${record.id}`, { method: 'PATCH', body: form.value })
		);
		return outcome.ok ? { message: 'Transaksi disimpan.' } : outcome.failure;
	},

	delete: async (event) => {
		const record = requireRecordId(await event.request.formData());
		if (!record.ok) return record.failure;

		const outcome = await runBackendAction(event, (client) =>
			client.request(`/transactions/${record.id}`, { method: 'DELETE' })
		);
		return outcome.ok ? { message: 'Transaksi dihapus.' } : outcome.failure;
	}
};
