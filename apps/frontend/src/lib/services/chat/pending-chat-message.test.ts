import { afterEach, describe, expect, test } from 'bun:test';
import { setPendingChatMessage, takePendingChatMessage } from './pending-chat-message';

describe('pending chat message', () => {
	afterEach(() => setPendingChatMessage(null));

	test('returns null when nothing is pending', () => {
		expect(takePendingChatMessage()).toBeNull();
	});

	test('returns the pending text only once', () => {
		setPendingChatMessage('Halo');

		expect(takePendingChatMessage()).toBe('Halo');
		expect(takePendingChatMessage()).toBeNull();
	});

	test('clearing drops a pending text', () => {
		setPendingChatMessage('Halo');
		setPendingChatMessage(null);

		expect(takePendingChatMessage()).toBeNull();
	});
});
