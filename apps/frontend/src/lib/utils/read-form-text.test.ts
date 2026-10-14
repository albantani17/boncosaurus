import { describe, expect, test } from 'bun:test';
import { readFormText } from './read-form-text';

describe('readFormText', () => {
	test('returns the trimmed value', () => {
		const data = new FormData();
		data.set('name', '  Kas  ');

		expect(readFormText(data, 'name')).toBe('Kas');
	});

	test('returns an empty string for a missing key', () => {
		expect(readFormText(new FormData(), 'name')).toBe('');
	});
});
