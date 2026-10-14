import { describe, expect, test } from 'bun:test';
import { describeHttpError } from './describe-http-error';

describe('describeHttpError', () => {
	test('describes known statuses in Indonesian', () => {
		expect(describeHttpError(404).title).toBe('Halaman tidak ditemukan');
		expect(describeHttpError(403).title).toBe('Akses ditolak');
		expect(describeHttpError(400).title).toBe('Permintaan tidak valid');
	});

	test('falls back to a server message for unknown 5xx codes', () => {
		expect(describeHttpError(599).title).toBe('Terjadi kesalahan di server');
	});

	test('falls back to a generic message for unknown 4xx codes', () => {
		expect(describeHttpError(418).title).toBe('Permintaan gagal');
	});

	test('marks server errors, timeouts and rate limits as retryable', () => {
		expect(describeHttpError(500).retryable).toBe(true);
		expect(describeHttpError(503).retryable).toBe(true);
		expect(describeHttpError(408).retryable).toBe(true);
		expect(describeHttpError(429).retryable).toBe(true);
	});

	test('does not mark other client errors as retryable', () => {
		expect(describeHttpError(404).retryable).toBe(false);
		expect(describeHttpError(400).retryable).toBe(false);
	});
});
