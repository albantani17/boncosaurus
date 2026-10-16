import { describe, expect, test } from 'bun:test';
import { readTzOffset } from './read-tz-offset';

const formWith = (tzOffset?: string) => {
	const data = new FormData();
	if (tzOffset !== undefined) data.set('tzOffset', tzOffset);
	return data;
};

describe('readTzOffset', () => {
	test('reads the offset sent by the browser', () => {
		expect(readTzOffset(formWith('-420'), 0)).toBe(-420);
	});

	test('falls back when the field is missing or not a number', () => {
		expect(readTzOffset(formWith(), 60)).toBe(60);
		expect(readTzOffset(formWith('abc'), 60)).toBe(60);
	});
});
