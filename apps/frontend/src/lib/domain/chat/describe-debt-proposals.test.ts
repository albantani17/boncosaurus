import { describe, expect, test } from 'bun:test';
import type { DebtPaymentProposalDraft, DebtProposalDraft } from '../../types/ai.types';
import { describeDebtPaymentProposal, describeDebtProposal, describeDebtWriteOffProposal } from './describe-debt-proposals';

const accounts = [{ id: 'acc-1', name: 'BCA', currency: 'IDR' }];
const categories = [
	{ id: 'cat-shop', name: 'Belanja' },
	{ id: 'cat-in', name: 'Bunga diterima' }
];
const lend: DebtProposalDraft = {
	direction: 'receivable',
	sourceType: 'personal',
	origin: 'cash',
	counterpartyName: 'Sultan',
	title: 'Pinjam',
	principal: 30_000,
	originatedAt: '2026-10-10T02:00:00.000Z',
	accountId: 'acc-1',
	dueDate: '2026-10-31',
	reminderDays: 0,
	note: 'gajian'
};
const values = (rows: { label: string; value: string }[]) => Object.fromEntries(rows.map((row) => [row.label, row.value]));

describe('describeDebtProposal', () => {
	test('describes money lent from an account', () => {
		const summary = describeDebtProposal(lend, accounts, categories);
		expect(summary).toMatchObject({ kicker: 'Draf piutang', amount: 'Rp30.000', tone: 'income', savedHref: '/hutang' });
		expect(values(summary.rows)).toMatchObject({
			Dari: 'Sultan',
			Untuk: 'Pinjam',
			Sumber: 'Perorangan',
			'Keluar dari': 'BCA',
			'Jatuh tempo': '31 Okt 2026',
			Pengingat: 'Pada hari jatuh tempo',
			Catatan: 'gajian'
		});
	});

	test('describes a paylater purchase with its schedule', () => {
		const summary = describeDebtProposal(
			{
				...lend,
				direction: 'payable',
				sourceType: 'paylater',
				origin: 'purchase',
				accountId: null,
				categoryId: 'cat-shop',
				currency: 'IDR',
				dueDate: null,
				reminderDays: 3,
				note: null,
				schedule: { firstDueDate: '2026-11-05', count: 3, installmentAmount: 105_000 }
			},
			accounts,
			categories
		);
		expect(summary).toMatchObject({ kicker: 'Draf hutang', tone: 'expense' });
		expect(values(summary.rows)).toMatchObject({
			Ke: 'Sultan',
			Kategori: 'Belanja · belum ada uang keluar',
			Cicilan: '3× Rp105.000 mulai 5 Nov 2026',
			Pengingat: '3 hari sebelumnya'
		});
		expect(values(summary.rows)).not.toHaveProperty('Jatuh tempo');
		expect(values(summary.rows)).not.toHaveProperty('Catatan');
	});

	test('mentions an even split and marks unknown references', () => {
		const summary = describeDebtProposal(
			{
				...lend,
				accountId: 'gone',
				counterpartyName: null,
				reminderDays: null,
				schedule: { firstDueDate: '2026-11-05', count: 2, installmentAmount: null }
			},
			accounts,
			categories
		);
		expect(values(summary.rows)).toMatchObject({
			Dari: 'Tidak ditemukan',
			'Keluar dari': 'Tidak ditemukan',
			Cicilan: '2× dibagi rata mulai 5 Nov 2026'
		});
		expect(values(summary.rows)).not.toHaveProperty('Pengingat');
	});
});

const payment: DebtPaymentProposalDraft = {
	debtId: 'debt-1',
	debtTitle: 'Kopi',
	counterpartyName: 'Sultan',
	direction: 'receivable',
	currency: 'IDR',
	principalAmount: 22_000,
	extraAmount: 3_000,
	accountId: 'acc-1',
	amount: 25_000,
	paidAt: '2026-10-14T03:00:00.000Z',
	extraCategoryId: 'cat-in',
	note: 'lunas'
};

describe('describeDebtPaymentProposal', () => {
	test('shows the split of an overpayment', () => {
		const summary = describeDebtPaymentProposal(payment, accounts, categories);
		expect(summary).toMatchObject({ kicker: 'Draf terima pembayaran', amount: 'Rp25.000', savedHref: '/hutang/debt-1' });
		expect(values(summary.rows)).toMatchObject({
			Dari: 'Sultan · Kopi',
			'Ke akun': 'BCA',
			Rincian: 'Rp22.000 pokok + Rp3.000 lebih bayar',
			'Kategori lebih': 'Bunga diterima',
			Catatan: 'lunas'
		});
	});

	test('keeps a plain payment short', () => {
		const summary = describeDebtPaymentProposal(
			{ ...payment, direction: 'payable', extraAmount: 0, principalAmount: 25_000, note: null },
			accounts,
			categories
		);
		expect(summary.kicker).toBe('Draf bayar hutang');
		expect(values(summary.rows)).not.toHaveProperty('Rincian');
		expect(values(summary.rows)).toHaveProperty('Dari akun', 'BCA');
	});

	test('labels interest of a payable without a category', () => {
		const summary = describeDebtPaymentProposal({ ...payment, direction: 'payable', extraCategoryId: null }, accounts, categories);
		expect(values(summary.rows)).toMatchObject({
			Rincian: 'Rp22.000 pokok + Rp3.000 bunga/biaya',
			'Kategori lebih': 'Tanpa kategori'
		});
	});
});

describe('describeDebtWriteOffProposal', () => {
	const writeOff = { debtId: 'debt-1', debtTitle: 'Kopi', counterpartyName: 'Sultan', currency: 'IDR', amount: 4_000 };

	test('explains a forgiven receivable as an expense', () => {
		const summary = describeDebtWriteOffProposal({ ...writeOff, direction: 'receivable' });
		expect(summary).toMatchObject({ amount: 'Rp4.000', tone: 'income', savedHref: '/hutang/debt-1' });
		expect(values(summary.rows)).toMatchObject({ 'Piutang dari': 'Sultan · Kopi', Dampak: expect.stringContaining('pengeluaran') });
	});

	test('explains a forgiven payable as income', () => {
		const summary = describeDebtWriteOffProposal({ ...writeOff, direction: 'payable' });
		expect(values(summary.rows)).toMatchObject({ 'Hutang ke': 'Sultan · Kopi', Dampak: expect.stringContaining('pemasukan') });
	});
});
