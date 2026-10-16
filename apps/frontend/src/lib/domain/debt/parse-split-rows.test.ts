import { describe, expect, test } from 'bun:test';
import { parseSplitRows } from './parse-split-rows';

const formWith = (rows: [string, string][]) => {
	const data = new FormData();
	for (const [name, amount] of rows) {
		data.append('splitName', name);
		data.append('splitAmount', amount);
	}
	return data;
};

describe('parseSplitRows', () => {
	test('reads each person and their share', () => {
		expect(parseSplitRows(formWith([[' Hani ', '60.000'], ['Roy', '20000']]), 100_000)).toEqual({
			ok: true,
			value: [
				{ counterpartyName: 'Hani', amount: 60_000 },
				{ counterpartyName: 'Roy', amount: 20_000 }
			]
		});
	});

	test('returns no splits when there are no rows', () => {
		expect(parseSplitRows(new FormData(), 100)).toEqual({ ok: true, value: [] });
	});

	test('ignores rows left completely empty', () => {
		expect(parseSplitRows(formWith([['', ''], ['Hani', '10']]), 100)).toEqual({
			ok: true,
			value: [{ counterpartyName: 'Hani', amount: 10 }]
		});
	});

	test('accepts shares that add up to the whole expense', () => {
		expect(parseSplitRows(formWith([['Hani', '100']]), 100).ok).toBe(true);
	});

	test('requires a name for a share', () => {
		expect(parseSplitRows(formWith([['', '10']]), 100).ok).toBe(false);
	});

	test('requires a positive whole amount', () => {
		expect(parseSplitRows(formWith([['Hani', '']]), 100)).toEqual({
			ok: false,
			message: 'Bagian Hani harus angka bulat lebih dari 0.'
		});
	});

	test('rejects shares larger than the expense', () => {
		expect(parseSplitRows(formWith([['Hani', '60'], ['Roy', '50']]), 100).ok).toBe(false);
	});

	test('limits the number of people', () => {
		const rows = Array.from({ length: 21 }, (_, index): [string, string] => [`P${index}`, '1']);
		expect(parseSplitRows(formWith(rows), 100).ok).toBe(false);
	});
});
