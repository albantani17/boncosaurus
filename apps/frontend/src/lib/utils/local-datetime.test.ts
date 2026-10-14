import { describe, expect, test } from 'bun:test';
import { parseLocalDatetime, toDatetimeInputValue } from './local-datetime';

const WIB = -420;

describe('parseLocalDatetime', () => {
	test('converts a WIB wall-clock time to UTC', () => {
		expect(parseLocalDatetime('2026-10-14T08:30', WIB)).toEqual(new Date('2026-10-14T01:30:00Z'));
	});

	test('handles crossing midnight into the previous UTC day', () => {
		expect(parseLocalDatetime('2026-10-14T03:00', WIB)).toEqual(new Date('2026-10-13T20:00:00Z'));
	});

	test('treats offset 0 as UTC', () => {
		expect(parseLocalDatetime('2026-01-01T00:00', 0)).toEqual(new Date('2026-01-01T00:00:00Z'));
	});

	test('rejects malformed values', () => {
		expect(parseLocalDatetime('', WIB)).toBeNull();
		expect(parseLocalDatetime('14/10/2026 08:30', WIB)).toBeNull();
	});
});

describe('toDatetimeInputValue', () => {
	test('formats a UTC instant as WIB wall-clock time', () => {
		expect(toDatetimeInputValue(new Date('2026-10-13T20:05:00Z'), WIB)).toBe('2026-10-14T03:05');
	});

	test('round-trips with parseLocalDatetime', () => {
		const instant = new Date('2026-12-31T23:59:00Z');

		expect(parseLocalDatetime(toDatetimeInputValue(instant, WIB), WIB)).toEqual(instant);
	});
});
