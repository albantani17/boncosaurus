import { json } from '@sveltejs/kit';
import { ApiError } from '#lib/server/api/api-error.ts';
import { backendFor } from '#lib/server/api/backend.ts';
import { loadTransactionPage } from '#lib/server/services/transaction-list.service.ts';
import { readTransactionFilters } from '#lib/utils/transaction-filters.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, fetch, url }) => {
	if (!locals.accessToken) return json({ message: 'Sesi berakhir. Silakan masuk lagi.' }, { status: 401 });

	const filters = readTransactionFilters(url.searchParams, new Date());
	const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0);
	try {
		const page = await loadTransactionPage(backendFor(fetch, { accessToken: locals.accessToken }), filters, offset);
		return json({ rows: page.rows, hasMore: page.hasMore });
	} catch (error) {
		const status = error instanceof ApiError ? error.status : 502;
		return json({ message: 'Gagal memuat transaksi.' }, { status });
	}
};
