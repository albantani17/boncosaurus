import { describe, expect, test } from 'bun:test';
import { parseDebtPaymentForm } from './parse-debt-payment-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	const defaults = { accountId: 'acc-1', amount: '25.000', paidAt: '2026-10-14T10:00', tzOffset: '-420' };
	for (const [key, value] of Object.entries({ ...defaults, ...fields })) data.set(key, value);
	return data;
};

describe('parseDebtPaymentForm', () => {
	test('parses a payment with a charge category', () => {
		expect(parseDebtPaymentForm(formWith({ extraCategoryId: 'cat-1', note: ' lunas ' }), 0)).toEqual({
			ok: true,
			value: {
				accountId: 'acc-1',
				amount: 25_000,
				paidAt: '2026-10-14T03:00:00.000Z',
				extraCategoryId: 'cat-1',
				note: 'lunas'
			}
		});
	});

	test('leaves the optional fields empty', () => {
		const result = parseDebtPaymentForm(formWith({}), 0);
		expect(result.ok && result.value).toMatchObject({ extraCategoryId: null, note: null });
	});

	test.each([
		['a missing account', { accountId: '' }],
		['a zero amount', { amount: '0' }],
		['an invalid date', { paidAt: '' }],
		['a long note', { note: 'x'.repeat(501) }]
	])('rejects %s', (_label, fields) => {
		expect(parseDebtPaymentForm(formWith(fields), 0).ok).toBe(false);
	});
});
