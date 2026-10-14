import { describe, expect, test } from 'bun:test';
import { readSetCookie } from './read-set-cookie';

describe('readSetCookie', () => {
	test('reads the value and max-age of the named cookie', () => {
		const headers = ['refresh_token=abc123; Max-Age=2592000; Path=/auth; HttpOnly; SameSite=Lax'];

		expect(readSetCookie(headers, 'refresh_token')).toEqual({ value: 'abc123', maxAge: 2592000 });
	});

	test('picks the right cookie among several', () => {
		const headers = ['other=1; Path=/', 'refresh_token=xyz; Path=/auth'];

		expect(readSetCookie(headers, 'refresh_token')?.value).toBe('xyz');
	});

	test('leaves maxAge undefined when the attribute is missing', () => {
		expect(readSetCookie(['refresh_token=xyz'], 'refresh_token')).toEqual({
			value: 'xyz',
			maxAge: undefined
		});
	});

	test('decodes url-encoded values', () => {
		expect(readSetCookie(['refresh_token=a%2Bb'], 'refresh_token')?.value).toBe('a+b');
	});

	test('returns undefined when the cookie is absent', () => {
		expect(readSetCookie(['other=1'], 'refresh_token')).toBeUndefined();
		expect(readSetCookie([], 'refresh_token')).toBeUndefined();
	});

	test('does not match a cookie whose name only starts with the wanted name', () => {
		expect(readSetCookie(['refresh_token_old=1'], 'refresh_token')).toBeUndefined();
	});
});
