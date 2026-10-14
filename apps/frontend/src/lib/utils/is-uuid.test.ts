import { describe, expect, test } from 'bun:test';
import { isUuid } from './is-uuid';

describe('isUuid', () => {
	test('accepts a UUIDv7', () => {
		expect(isUuid('01a13ae8-1cb0-700b-86f1-b08abcf593ef')).toBe(true);
	});

	test('rejects other strings, including path tricks', () => {
		expect(isUuid('')).toBe(false);
		expect(isUuid('abc')).toBe(false);
		expect(isUuid('../accounts')).toBe(false);
	});
});
