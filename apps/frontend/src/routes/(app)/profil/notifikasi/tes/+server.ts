import { forwardJson } from '#lib/server/api/forward-json.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = (event) => forwardJson(event, '/push/test', { method: 'POST' });
