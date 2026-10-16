import { describe, expect, test } from 'bun:test';
import { decodeBase64Url } from './decode-base64-url';

describe('decodeBase64Url', () => {
	test('decodes url-safe characters without padding', () => {
		expect([...decodeBase64Url('-_8')]).toEqual([251, 255]);
	});

	test('decodes plain base64 text', () => {
		expect(new TextDecoder().decode(decodeBase64Url('aGFsbw'))).toBe('halo');
	});
});
