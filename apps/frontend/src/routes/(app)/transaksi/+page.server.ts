import { backendFor } from '#lib/server/api/backend.ts';
import { requireRecordId } from '#lib/server/actions/require-record-id.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import { loadTransactionPage } from '#lib/server/services/transaction/transaction-list.service.ts';
import type { Counterparty, PeriodSummary } from '#lib/types/api.types.ts';
import { formatMonthLabel } from '#lib/utils/format-month-label.ts';
import { parseSplitRows } from '#lib/domain/debt/parse-split-rows.ts';
import { parseTransactionForm } from '#lib/domain/transaction/parse-transaction-form.ts';
import { monthRangeOf, readTransactionFilters } from '#lib/domain/transaction/transaction-filters.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent, url }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const filters = readTransactionFilters(url.searchParams, new Date());
	const { from, to } = monthRangeOf(filters.month);
	const summaryQuery = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

	const [page, summary, counterparties] = await Promise.all([
		loadTransactionPage(client, filters, 0),
		client.get<PeriodSummary>(`/reports/summary?${summaryQuery}`),
		client.get<Counterparty[]>('/counterparties')
	]);
	const monthTotals = summary.totals.find((totals) => totals.currency === workspace.baseCurrency) ?? {
		currency: workspace.baseCurrency,
		income: 0,
		expense: 0,
		net: 0
	};

	return { ...page, counterparties, filters, monthTotals, monthLabel: formatMonthLabel(from) };
};

const parseForm = (data: FormData) => parseTransactionForm(data, new Date().getTimezoneOffset());

export const actions: Actions = {
	create: async (event) => {
		const data = await event.request.formData();
		const form = parseForm(data);
		if (!form.ok) return formFailure(form.message);
		const splits = form.value.type === 'expense' ? parseSplitRows(data, form.value.amount) : { ok: true as const, value: [] };
		if (!splits.ok) return formFailure(splits.message);

		const body = splits.value.length > 0 ? { ...form.value, splits: splits.value } : form.value;
		const outcome = await runBackendAction(event, (client) => client.request('/transactions', { method: 'POST', body }));
		if (!outcome.ok) return outcome.failure;
		return { message: splits.value.length > 0 ? 'Transaksi dan piutangnya dicatat.' : 'Transaksi dicatat.' };
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
