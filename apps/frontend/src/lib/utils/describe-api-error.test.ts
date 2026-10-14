import { describe, expect, test } from 'bun:test';
import { describeApiError } from './describe-api-error';

describe('describeApiError', () => {
	test('translates a known error code', () => {
		expect(describeApiError('EMAIL_TAKEN')).toBe('Email ini sudah dipakai akun lain.');
	});

	test('falls back to a generic message for unknown codes', () => {
		expect(describeApiError('SOMETHING_NEW')).toBe('Terjadi kesalahan. Coba lagi sebentar lagi.');
	});

	test('prefers a context-specific override for the same code', () => {
		expect(describeApiError('ACCOUNT_HAS_TRANSACTIONS', { ACCOUNT_HAS_TRANSACTIONS: 'Tidak bisa dihapus.' })).toBe(
			'Tidak bisa dihapus.'
		);
	});

	test('ignores overrides for other codes', () => {
		expect(describeApiError('EMAIL_TAKEN', { ACCOUNT_HAS_TRANSACTIONS: 'x' })).toBe('Email ini sudah dipakai akun lain.');
	});

	test('falls back when there is no code', () => {
		expect(describeApiError(undefined)).toContain('Terjadi kesalahan');
	});
});

describe('describeApiError import codes', () => {
	test('translates import errors', () => {
		expect(describeApiError('IMPORT_TOO_LARGE')).toBe('File terlalu besar. Maksimal 5 MB.');
		expect(describeApiError('IMPORT_UNSUPPORTED_FILE')).toContain('Format file tidak didukung');
	});
});
