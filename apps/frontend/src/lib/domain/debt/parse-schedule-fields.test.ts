import { describe, expect, test } from 'bun:test';
import { parseScheduleFields } from './parse-schedule-fields';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries({ withSchedule: 'on', firstDueDate: '2026-11-05', installmentCount: '3', ...fields })) {
		data.set(key, value);
	}
	return data;
};

describe('parseScheduleFields', () => {
	test('returns null when the schedule is not enabled', () => {
		expect(parseScheduleFields(new FormData())).toEqual({ ok: true, value: null });
	});

	test('reads a schedule with a per-installment amount', () => {
		expect(parseScheduleFields(formWith({ installmentAmount: '105.000' }))).toEqual({
			ok: true,
			value: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }
		});
	});

	test('leaves the amount empty to split the principal evenly', () => {
		expect(parseScheduleFields(formWith({}))).toEqual({
			ok: true,
			value: { firstDueDate: '2026-11-05', count: 3, installmentAmount: null }
		});
	});

	test('requires the first due date', () => {
		expect(parseScheduleFields(formWith({ firstDueDate: '' })).ok).toBe(false);
	});

	test.each(['0', '121', '1.5', 'x'])('rejects an installment count of %p', (installmentCount) => {
		expect(parseScheduleFields(formWith({ installmentCount })).ok).toBe(false);
	});

	test('rejects an invalid per-installment amount', () => {
		expect(parseScheduleFields(formWith({ installmentAmount: '-5' })).ok).toBe(false);
	});
});
