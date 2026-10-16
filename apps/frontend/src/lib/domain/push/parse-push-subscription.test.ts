import { describe, expect, test } from 'bun:test';
import { parsePushSubscription } from './parse-push-subscription';

const subscription = {
	endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
	expirationTime: null,
	keys: { p256dh: 'BPx', auth: 'xyz' }
};

describe('parsePushSubscription', () => {
	test('keeps the endpoint and keys', () => {
		expect(parsePushSubscription(subscription)).toEqual({
			endpoint: subscription.endpoint,
			keys: { p256dh: 'BPx', auth: 'xyz' }
		});
	});

	test.each([
		['nothing', null],
		['a string', 'https://x'],
		['a plain http endpoint', { ...subscription, endpoint: 'http://push.local' }],
		['missing keys', { endpoint: subscription.endpoint }],
		['an empty key', { ...subscription, keys: { p256dh: '', auth: 'xyz' } }]
	])('rejects %s', (_label, value) => {
		expect(parsePushSubscription(value)).toBeNull();
	});
});
