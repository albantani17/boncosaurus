import { describe, expect, test } from 'bun:test';
import { parseImportCommitForm, parseImportUploadForm } from './parse-import-form';

const formWith = (entries: Record<string, string | File>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) data.set(key, value);
	return data;
};
const csv = new File(['a,b'], 'm.csv');

describe('parseImportUploadForm', () => {
	test('forwards the file with time zone and offset', () => {
		const result = parseImportUploadForm(formWith({ file: csv, timeZone: 'Asia/Jakarta', utcOffsetMinutes: '420' }));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect((result.value.get('file') as File).name).toBe('m.csv');
		expect(result.value.get('timeZone')).toBe('Asia/Jakarta');
		expect(result.value.get('utcOffsetMinutes')).toBe('420');
	});

	test('drops a malformed offset', () => {
		const result = parseImportUploadForm(formWith({ file: csv, utcOffsetMinutes: 'abc' }));
		expect(result.ok && result.value.has('utcOffsetMinutes')).toBe(false);
	});

	test('rejects a missing or empty file', () => {
		expect(parseImportUploadForm(formWith({})).ok).toBe(false);
		expect(parseImportUploadForm(formWith({ file: new File([], 'e.csv') })).ok).toBe(false);
	});

	test('rejects a file over 5 MB', () => {
		const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.csv');
		expect(parseImportUploadForm(formWith({ file: big }))).toEqual({ ok: false, message: 'File terlalu besar. Maksimal 5 MB.' });
	});
});

describe('parseImportCommitForm', () => {
	test('parses the payload JSON', () => {
		const payload = { accounts: [], categories: [], rows: [{ amount: 1 }] };
		const result = parseImportCommitForm(formWith({ payload: JSON.stringify(payload) }));
		expect(result.ok && result.value).toEqual(payload as never);
	});

	test('rejects broken JSON and empty selections', () => {
		expect(parseImportCommitForm(formWith({ payload: '{' })).ok).toBe(false);
		expect(parseImportCommitForm(formWith({ payload: '{"rows":[]}' })).ok).toBe(false);
	});
});
