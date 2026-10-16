import type { Debt } from '../../types/api.types';

export const makeDebt = (overrides: Partial<Debt> = {}): Debt => ({
	id: 'debt-1',
	direction: 'receivable',
	sourceType: 'personal',
	origin: 'cash',
	counterpartyId: 'cp-1',
	counterpartyName: 'Sultan',
	counterpartyKind: 'person',
	title: 'Pinjam',
	currency: 'IDR',
	principal: 30_000,
	originatedAt: '2026-10-10T02:00:00.000Z',
	dueDate: null,
	status: 'active',
	closedAt: null,
	writtenOffAmount: null,
	note: null,
	accountId: 'acc-1',
	categoryId: null,
	originTransactionId: null,
	reminderDays: 0,
	installmentCount: 0,
	position: {
		totalDue: 30_000,
		paid: 0,
		remaining: 30_000,
		principalRemaining: 30_000,
		nextDueDate: null,
		nextDueAmount: null,
		isOverdue: false
	},
	...overrides
});
