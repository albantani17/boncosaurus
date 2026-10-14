import { describe, expect, test } from 'bun:test';
import { accessCookieMaxAge, resolveCookieSecure } from './session-cookie-options';

describe('accessCookieMaxAge', () => {
	test('expires the cookie slightly before the token does', () => {
		expect(accessCookieMaxAge(900)).toBe(870);
	});

	test('never returns less than one second', () => {
		expect(accessCookieMaxAge(10)).toBe(1);
	});
});

describe('resolveCookieSecure', () => {
	test('follows COOKIE_SECURE when set', () => {
		expect(resolveCookieSecure('true', undefined)).toBe(true);
		expect(resolveCookieSecure('false', 'production')).toBe(false);
	});

	test('defaults to secure in production', () => {
		expect(resolveCookieSecure(undefined, 'production')).toBe(true);
		expect(resolveCookieSecure('', 'production')).toBe(true);
	});

	test('defaults to insecure outside production', () => {
		expect(resolveCookieSecure(undefined, 'development')).toBe(false);
		expect(resolveCookieSecure(undefined, undefined)).toBe(false);
	});
});
