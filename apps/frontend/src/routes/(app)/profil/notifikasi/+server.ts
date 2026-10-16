import { json } from '@sveltejs/kit';
import { forwardJson } from '#lib/server/api/forward-json.ts';
import { describeApiError } from '#lib/domain/error/describe-api-error.ts';
import { parsePushSubscription } from '#lib/domain/push/parse-push-subscription.ts';
import type { RequestHandler } from './$types';

const invalid = () => json({ message: describeApiError('VALIDATION_ERROR') }, { status: 400 });

export const POST: RequestHandler = async (event) => {
	const subscription = parsePushSubscription(await event.request.json().catch(() => null));
	if (!subscription) return invalid();
	return forwardJson(event, '/push/subscriptions', { method: 'POST', body: subscription });
};

export const DELETE: RequestHandler = async (event) => {
	const subscription = parsePushSubscription(await event.request.json().catch(() => null));
	if (!subscription) return invalid();
	return forwardJson(event, '/push/subscriptions', { method: 'DELETE', body: { endpoint: subscription.endpoint } });
};
