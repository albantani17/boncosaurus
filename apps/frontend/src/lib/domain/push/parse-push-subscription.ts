import type { PushSubscriptionBody } from '@boncosaurus/shared';

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** Keeps only the fields the backend stores from a browser `PushSubscription#toJSON()`. */
export function parsePushSubscription(value: unknown): PushSubscriptionBody | null {
	if (typeof value !== 'object' || value === null) return null;
	const { endpoint, keys } = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
	if (!isText(endpoint) || !endpoint.startsWith('https://')) return null;
	if (!keys || !isText(keys.p256dh) || !isText(keys.auth)) return null;
	return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
