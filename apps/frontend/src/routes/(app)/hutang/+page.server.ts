import { backendFor } from '#lib/server/api/backend.ts';
import { formFailure, runBackendAction } from '#lib/server/actions/run-backend-action.ts';
import type { Account, Category, Counterparty, Debt, DebtSummary } from '#lib/types/api.types.ts';
import { parseDebtForm } from '#lib/domain/debt/parse-debt-form.ts';
import { readDebtFilters } from '#lib/domain/debt/read-debt-filters.ts';
import { toDateInputValue } from '#lib/utils/to-date-input-value.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, parent, url }) => {
	const { workspace } = await parent();
	const client = backendFor(fetch, { accessToken: locals.accessToken, workspaceId: workspace.id });
	const filters = readDebtFilters(url.searchParams);
	const debtQuery = new URLSearchParams({ direction: filters.direction });
	if (filters.view === 'active') debtQuery.set('status', 'active');

	const [debts, summary, accounts, categories, counterparties] = await Promise.all([
		client.get<Debt[]>(`/debts?${debtQuery}`),
		client.get<DebtSummary>('/debts/summary'),
		client.get<Account[]>('/accounts'),
		client.get<Category[]>('/categories'),
		client.get<Counterparty[]>('/counterparties')
	]);

	return {
		filters,
		debts: filters.view === 'closed' ? debts.filter((debt) => debt.status !== 'active') : debts,
		summary,
		accounts,
		categories,
		counterparties,
		today: toDateInputValue(new Date())
	};
};

export const actions: Actions = {
	create: async (event) => {
		const form = parseDebtForm(await event.request.formData(), new Date().getTimezoneOffset());
		if (!form.ok) return formFailure(form.message);

		const outcome = await runBackendAction(event, (client) => client.request('/debts', { method: 'POST', body: form.value }));
		return outcome.ok ? { message: 'Hutang/piutang dicatat.' } : outcome.failure;
	}
};
