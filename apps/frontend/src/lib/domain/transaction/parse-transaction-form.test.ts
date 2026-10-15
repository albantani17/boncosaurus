import { describe, expect, test } from 'bun:test';
import { parseTransactionForm } from './parse-transaction-form';

const WIB = -420;
const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	const defaults = {
		type: 'expense',
		amount: '25.000',
		accountId: 'acc-1',
		occurredAt: '2026-10-14T08:30',
		tzOffset: String(WIB)
	};
	for (const [key, value] of Object.entries({ ...defaults, ...fields })) data.set(key, value);
	return data;
};

describe('parseTransactionForm', () => {
	test('parses an expense with category and note', () => {
		expect(parseTransactionForm(formWith({ categoryId: 'cat-1', note: ' Sarapan ' }), 0)).toEqual({
			ok: true,
			value: {
				type: 'expense',
				accountId: 'acc-1',
				toAccountId: null,
				categoryId: 'cat-1',
				amount: 25000,
				toAmount: null,
				fee: null,
				occurredAt: '2026-10-14T01:30:00.000Z',
				note: 'Sarapan'
			}
		});
	});

	test('stores an empty category and note as null', () => {
		expect(parseTransactionForm(formWith({ categoryId: '', note: '' }), 0)).toMatchObject({
			value: { categoryId: null, note: null }
		});
	});

	test('parses a transfer and drops any category', () => {
		const result = parseTransactionForm(
			formWith({ type: 'transfer', toAccountId: 'acc-2', categoryId: 'cat-1', toAmount: '' }),
			0
		);

		expect(result).toMatchObject({ value: { toAccountId: 'acc-2', categoryId: null, toAmount: null } });
	});

	test('keeps the received amount of a cross-currency transfer', () => {
		const result = parseTransactionForm(formWith({ type: 'transfer', toAccountId: 'acc-2', toAmount: '15' }), 0);

		expect(result).toMatchObject({ value: { toAmount: 15 } });
	});

	test('ignores destination fields on non-transfers', () => {
		expect(parseTransactionForm(formWith({ toAccountId: 'acc-2', toAmount: '10' }), 0)).toMatchObject({
			value: { toAccountId: null, toAmount: null }
		});
	});

	test('uses the server offset when the browser did not send one', () => {
		expect(parseTransactionForm(formWith({ tzOffset: '' }), 0)).toMatchObject({
			value: { occurredAt: '2026-10-14T08:30:00.000Z' }
		});
	});

	test('rejects a zero amount', () => {
		expect(parseTransactionForm(formWith({ amount: '0' }), 0)).toMatchObject({ ok: false });
	});

	test('rejects a missing account', () => {
		expect(parseTransactionForm(formWith({ accountId: '' }), 0)).toEqual({ ok: false, message: 'Pilih akun.' });
	});

	test('rejects a transfer without destination', () => {
		expect(parseTransactionForm(formWith({ type: 'transfer' }), 0)).toMatchObject({ ok: false });
	});

	test('rejects a transfer to the same account', () => {
		expect(parseTransactionForm(formWith({ type: 'transfer', toAccountId: 'acc-1' }), 0)).toMatchObject({
			ok: false,
			message: 'Akun asal dan tujuan tidak boleh sama.'
		});
	});

	test('rejects an invalid received amount', () => {
		expect(
			parseTransactionForm(formWith({ type: 'transfer', toAccountId: 'acc-2', toAmount: 'abc' }), 0)
		).toMatchObject({ ok: false });
	});

	test('rejects an invalid date', () => {
		expect(parseTransactionForm(formWith({ occurredAt: 'kemarin' }), 0)).toMatchObject({ ok: false });
	});

	test('rejects an unknown type', () => {
		expect(parseTransactionForm(formWith({ type: 'gift' }), 0)).toMatchObject({ ok: false });
	});

	test('rejects a note longer than 500 characters', () => {
		expect(parseTransactionForm(formWith({ note: 'x'.repeat(501) }), 0)).toMatchObject({ ok: false });
	});

	test('keeps the admin fee of a transfer', () => {
		const transfer = { type: 'transfer', toAccountId: 'acc-2', fee: '2.500' };
		expect(parseTransactionForm(formWith(transfer), 0)).toMatchObject({ ok: true, value: { fee: 2500 } });
	});

	test('treats an empty fee as no fee', () => {
		const transfer = { type: 'transfer', toAccountId: 'acc-2', fee: '' };
		expect(parseTransactionForm(formWith(transfer), 0)).toMatchObject({ ok: true, value: { fee: null } });
	});

	test('rejects an invalid fee', () => {
		const transfer = { type: 'transfer', toAccountId: 'acc-2', fee: 'abc' };
		expect(parseTransactionForm(formWith(transfer), 0)).toEqual({ ok: false, message: 'Biaya admin harus angka bulat lebih dari 0.' });
	});

	test('ignores a fee on non-transfers', () => {
		expect(parseTransactionForm(formWith({ fee: '2500' }), 0)).toMatchObject({ ok: true, value: { fee: null } });
	});
});
