import { describe, expect, test } from 'bun:test';
import { formatTime } from './format-time';

describe('formatTime', () => {
	test('uses the Indonesian dot separator with leading zeros', () => {
		expect(formatTime(new Date(2026, 9, 14, 8, 5))).toBe('08.05');
	});

	test('formats midnight', () => {
		expect(formatTime(new Date(2026, 9, 14, 0, 0))).toBe('00.00');
	});
});
