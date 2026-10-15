export type RequestContext = { requestId: string; startedAt: number };

// Keyed by Request so onError can read it even when the failure happens before derive/resolve run.
const contexts = new WeakMap<Request, RequestContext>();

export const setRequestContext = (request: Request, context: RequestContext) => contexts.set(request, context);

export const getRequestContext = (request: Request) => contexts.get(request);
