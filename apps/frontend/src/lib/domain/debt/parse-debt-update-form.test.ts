import { describe, expect, test } from 'bun:test';
import { parseDebtUpdateForm } from './parse-debt-update-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries({ title: ' Kopi ', principal: '22000', ...fields })) data.set(key, value);
	return data;
};

describe('parseDebtUpdateForm', () => {
	test('parses the editable fields and removes a schedule that is unchecked', () => {
		expect(parseDebtUpdateForm(formWith({ dueDate: '2026-11-01' }))).toEqual({
			ok: true,
			value: { title: 'Kopi', principal: 22_000, dueDate: '2026-11-01', note: null, schedule: null }
		});
	});

	test('sends the schedule instead of a single due date', () => {
		const result = parseDebtUpdateForm(
			formWith({
				withSchedule: 'on',
				firstDueDate: '2026-11-05',
				installmentCount: '2',
				dueDate: '2026-11-01',
				note: 'x',
				reminderDays: '5'
			})
		);
		expect(result).toEqual({
			ok: true,
			value: {
				title: 'Kopi',
				principal: 22_000,
				dueDate: null,
				note: 'x',
				schedule: { firstDueDate: '2026-11-05', count: 2, installmentAmount: null },
				reminderDays: 5
			}
		});
	});

	test.each([
		['an empty title', { title: '' }],
		['a long title', { title: 'x'.repeat(121) }],
		['an invalid amount', { principal: 'abc' }],
		['an invalid due date', { dueDate: 'besok' }],
		['an invalid schedule', { withSchedule: 'on', installmentCount: '0', firstDueDate: '2026-11-05' }],
		['an invalid reminder', { reminderDays: '-2' }]
	])('rejects %s', (_label, fields) => {
		expect(parseDebtUpdateForm(formWith(fields)).ok).toBe(false);
	});
});
