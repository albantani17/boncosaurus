import { describe, expect, test } from 'bun:test';
import { parseDebtForm } from './parse-debt-form';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	const defaults = {
		direction: 'receivable',
		sourceType: 'personal',
		moneyFlow: 'cash',
		counterpartyName: ' Sultan ',
		principal: '30.000',
		originatedAt: '2026-10-10T09:00',
		accountId: 'acc-1',
		tzOffset: '-420'
	};
	for (const [key, value] of Object.entries({ ...defaults, ...fields })) data.set(key, value);
	return data;
};

const paylater = {
	direction: 'payable',
	sourceType: 'paylater',
	moneyFlow: 'purchase',
	counterpartyName: 'Shopee PayLater',
	title: 'Sepatu',
	accountId: '',
	categoryId: 'cat-1',
	currency: 'idr',
	withSchedule: 'on',
	firstDueDate: '2026-11-05',
	installmentCount: '3',
	installmentAmount: '105000',
	reminderDays: '3'
};

describe('parseDebtForm', () => {
	test('parses money lent from an account with a default title', () => {
		expect(parseDebtForm(formWith({ dueDate: '2026-10-31', note: ' bayar gajian ' }), 0)).toEqual({
			ok: true,
			value: {
				direction: 'receivable',
				sourceType: 'personal',
				origin: 'cash',
				counterpartyName: 'Sultan',
				title: 'Piutang dari Sultan',
				principal: 30_000,
				originatedAt: '2026-10-10T02:00:00.000Z',
				dueDate: '2026-10-31',
				note: 'bayar gajian',
				schedule: null,
				reminderDays: null,
				accountId: 'acc-1'
			}
		});
	});

	test('names a payable after who I owe', () => {
		const result = parseDebtForm(formWith({ direction: 'payable', counterpartyName: 'Roy' }), 0);
		expect(result.ok && result.value.title).toBe('Hutang ke Roy');
	});

	test('parses a paylater purchase with its schedule and drops the single due date', () => {
		const result = parseDebtForm(formWith({ ...paylater, dueDate: '2026-12-01' }), 0);
		expect(result).toMatchObject({
			ok: true,
			value: {
				origin: 'purchase',
				title: 'Sepatu',
				categoryId: 'cat-1',
				currency: 'IDR',
				dueDate: null,
				reminderDays: 3,
				schedule: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }
			}
		});
		expect(result.ok && 'accountId' in result.value).toBe(false);
	});

	test.each([
		['an unknown direction', { direction: 'x' }],
		['an unknown source', { sourceType: 'x' }],
		['a missing name', { counterpartyName: ' ' }],
		['a zero amount', { principal: '0' }],
		['an invalid date', { originatedAt: 'kemarin' }],
		['a long title', { title: 'x'.repeat(121) }],
		['an invalid due date', { dueDate: '31/10/2026' }],
		['an invalid schedule', { withSchedule: 'on', firstDueDate: '' }],
		['an invalid reminder', { reminderDays: '90' }],
		['a cash debt without account', { accountId: '' }],
		['an unknown money flow', { moneyFlow: '' }],
		['a receivable without money moving', { moneyFlow: 'purchase', categoryId: 'cat-1', currency: 'IDR' }],
		['a purchase without category', { ...paylater, categoryId: '' }],
		['a purchase with a bad currency', { ...paylater, currency: 'RP' }]
	])('rejects %s', (_label, fields) => {
		expect(parseDebtForm(formWith(fields), 0).ok).toBe(false);
	});
});
