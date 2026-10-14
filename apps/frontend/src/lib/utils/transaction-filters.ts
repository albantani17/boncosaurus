import type { TransactionType } from '../types/api.types';
import { getMonthRange } from './get-month-range';
import { isUuid } from './is-uuid';

export type TransactionFilterValues = {
	type: TransactionType | '';
	accountId: string;
	categoryId: string;
	month: string;
};

const TYPES: TransactionType[] = ['income', 'expense', 'transfer'];
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const pad = (value: number) => String(value).padStart(2, '0');

export const toMonthValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const readId = (params: URLSearchParams, key: string) => {
	const value = params.get(key) ?? '';
	return isUuid(value) ? value : '';
};

export function readTransactionFilters(params: URLSearchParams, now: Date): TransactionFilterValues {
	const type = (params.get('type') ?? '') as TransactionType;
	const month = params.get('month') ?? '';
	return {
		type: TYPES.includes(type) ? type : '',
		accountId: readId(params, 'accountId'),
		categoryId: readId(params, 'categoryId'),
		month: MONTH_PATTERN.test(month) ? month : toMonthValue(now)
	};
}

export function monthRangeOf(month: string) {
	const [year, monthNumber] = month.split('-').map(Number);
	return getMonthRange(new Date(year!, monthNumber! - 1, 1));
}

export function toTransactionQuery(filters: TransactionFilterValues, page: { limit: number; offset: number }) {
	const { from, to } = monthRangeOf(filters.month);
	const query = new URLSearchParams({
		from: from.toISOString(),
		to: to.toISOString(),
		limit: String(page.limit),
		offset: String(page.offset)
	});
	if (filters.type) query.set('type', filters.type);
	if (filters.accountId) query.set('accountId', filters.accountId);
	if (filters.categoryId) query.set('categoryId', filters.categoryId);
	return query;
}
