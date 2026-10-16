import { describe, expect, test } from 'bun:test';
import { summarizeSchedule } from './summarize-schedule';

describe('summarizeSchedule', () => {
	test('shows the interest built into fixed installments', () => {
		expect(summarizeSchedule(300_000, 3, 105_000)).toEqual({ perInstallment: 105_000, total: 315_000, interest: 15_000 });
	});

	test('splits the principal evenly when no amount is given', () => {
		expect(summarizeSchedule(100_000, 3, null)).toEqual({ perInstallment: 33_334, total: 100_000, interest: 0 });
	});

	test('never reports negative interest', () => {
		expect(summarizeSchedule(300_000, 2, 100_000)?.interest).toBe(0);
	});

	test.each([
		[0, 3],
		[100, 0],
		[100, 1.5]
	])('returns null for principal %p and count %p', (principal, count) => {
		expect(summarizeSchedule(principal, count, null)).toBeNull();
	});
});
