import { describe, expect, test } from 'bun:test';
import { readRecordId } from './read-record-id';

const formWith = (id: string) => {
	const data = new FormData();
	data.set('id', id);
	return data;
};

describe('readRecordId', () => {
	test('returns a valid record id', () => {
		expect(readRecordId(formWith('01a13ae8-1cb0-700b-86f1-b08abcf593ef'))).toBe('01a13ae8-1cb0-700b-86f1-b08abcf593ef');
	});

	test('returns null for anything that is not a UUID', () => {
		expect(readRecordId(formWith('../workspaces'))).toBeNull();
		expect(readRecordId(new FormData())).toBeNull();
	});
});
