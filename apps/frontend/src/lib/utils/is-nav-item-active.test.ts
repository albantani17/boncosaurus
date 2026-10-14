import { describe, expect, test } from 'bun:test';
import { isNavItemActive } from './is-nav-item-active';

describe('isNavItemActive', () => {
	test('matches the exact path', () => {
		expect(isNavItemActive('/akun', '/akun')).toBe(true);
	});

	test('matches nested paths', () => {
		expect(isNavItemActive('/transaksi/data', '/transaksi')).toBe(true);
	});

	test('does not match a path that only shares a prefix', () => {
		expect(isNavItemActive('/akunting', '/akun')).toBe(false);
	});
});
