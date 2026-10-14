import { describe, expect, test } from 'bun:test';
import { parseDraftReference } from './parse-draft-reference';

const MESSAGE_ID = '01a13b1b-63e5-7000-8b78-9b2f0c9997e6';

const formWith = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

describe('parseDraftReference', () => {
	test('reads the message and tool call ids', () => {
		expect(parseDraftReference(formWith({ messageId: MESSAGE_ID, toolCallId: 'call_1' }))).toEqual({
			ok: true,
			value: { messageId: MESSAGE_ID, toolCallId: 'call_1' }
		});
	});

	test('rejects a message id that is not a uuid', () => {
		expect(parseDraftReference(formWith({ messageId: 'msg-1', toolCallId: 'call_1' }))).toMatchObject({ ok: false });
	});

	test('rejects a missing tool call id', () => {
		expect(parseDraftReference(formWith({ messageId: MESSAGE_ID }))).toMatchObject({ ok: false });
	});
});
