import { describe, expect, test } from 'bun:test';
import type { ImportPreview } from '../../types/import.types';
import { buildCommitPayload } from './build-commit-payload';

const row = (key: number, accountName: string, categoryName: string | null) => ({
	key,
	occurredAt: '2026-10-01T05:00:00.000Z',
	type: 'expense' as const,
	amount: 1000,
	accountName,
	categoryName,
	note: 'x',
	duplicate: false,
	issues: []
});

const preview: ImportPreview = {
	fileName: 'a.csv',
	kind: 'csv',
	warnings: [],
	accounts: [
		{ name: 'BCA', accountId: 'acc-1', type: 'bank', currency: 'IDR' },
		{ name: 'Dana', accountId: null, type: 'bank', currency: 'IDR' }
	],
	categories: [
		{ name: 'Makan', categoryId: 'cat-1', type: 'expense' },
		{ name: 'Kopi', categoryId: null, type: 'expense' }
	],
	rows: [row(0, 'BCA', 'Makan'), row(1, 'Dana', 'Kopi'), row(2, 'BCA', null)]
};

const choose = (keys: number[], accountIds: [string, string | null][] = [], categoryIds: [string, string | null][] = []) => ({
	selectedKeys: new Set(keys),
	accountIds: new Map(accountIds),
	categoryIds: new Map(categoryIds)
});

describe('buildCommitPayload', () => {
	test('includes only selected rows and the accounts and categories they use', () => {
		const payload = buildCommitPayload(preview, choose([0, 2]));
		expect(payload.rows.map((r) => r.accountName)).toEqual(['BCA', 'BCA']);
		expect(payload.accounts.map((a) => a.name)).toEqual(['BCA']);
		expect(payload.categories.map((c) => c.name)).toEqual(['Makan']);
	});

	test('drops row bookkeeping fields', () => {
		const [first] = buildCommitPayload(preview, choose([0])).rows;
		expect(first).not.toHaveProperty('key');
		expect(first).not.toHaveProperty('duplicate');
		expect(first).not.toHaveProperty('issues');
	});

	test('applies the chosen mapping, including mapping to an existing record', () => {
		const payload = buildCommitPayload(preview, choose([1], [['Dana', 'acc-1']], [['Kopi', 'cat-1']]));
		expect(payload.accounts[0]!.accountId).toBe('acc-1');
		expect(payload.categories[0]!.categoryId).toBe('cat-1');
	});

	test('lets a choice reset an existing match to create new', () => {
		const payload = buildCommitPayload(preview, choose([0], [['BCA', null]]));
		expect(payload.accounts[0]!.accountId).toBeNull();
	});
});
