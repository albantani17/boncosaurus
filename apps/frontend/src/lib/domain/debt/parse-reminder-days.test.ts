import { describe, expect, test } from 'bun:test';
import { parseReminderDays } from './parse-reminder-days';

describe('parseReminderDays', () => {
	test('leaves an empty field to the default', () => {
		expect(parseReminderDays('')).toEqual({ ok: true, value: null });
	});

	test.each([
		['0', 0],
		['3', 3],
		['60', 60]
	])('reads %p days', (raw, days) => {
		expect(parseReminderDays(raw)).toEqual({ ok: true, value: days });
	});

	test.each(['-1', '61', '1.5', 'besok'])('rejects %p', (raw) => {
		expect(parseReminderDays(raw).ok).toBe(false);
	});
});
