import { describe, expect, test } from 'bun:test';
import { pickMascotState } from './pick-mascot-state';

const totals = (income: number, expense: number) => ({
	currency: 'IDR',
	income,
	expense,
	net: income - expense
});

describe('pickMascotState', () => {
	test('is idle without any totals', () => {
		expect(pickMascotState(undefined)).toBe('idle');
	});

	test('is happy when income covers expenses', () => {
		expect(pickMascotState(totals(1000, 400))).toBe('happy');
	});

	test('warns when expenses exceed income', () => {
		expect(pickMascotState(totals(100, 400))).toBe('warning');
	});

	test('is idle when nothing moved this month', () => {
		expect(pickMascotState(totals(0, 0))).toBe('idle');
	});
});
