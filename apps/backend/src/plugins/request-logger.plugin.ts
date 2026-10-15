import { Elysia } from 'elysia';
import { logger } from '../container';
import { pickRequestLogLevel } from '../utils/pick-request-log-level';
import { resolveRequestId } from '../utils/resolve-request-id';
import { getRequestContext, setRequestContext } from './request-context';

const SKIPPED_PATHS = new Set(['/health']);

type ResolvedActor = { userId?: string; workspaceId?: string };

export const requestLoggerPlugin = new Elysia({ name: 'request-logger' })
  .onRequest(({ request, set }) => {
    const requestId = resolveRequestId(request.headers.get('x-request-id'), () => Bun.randomUUIDv7());
    setRequestContext(request, { requestId, startedAt: performance.now() });
    set.headers['x-request-id'] = requestId;
  })
  .onAfterResponse({ as: 'global' }, (context) => {
    const { request, path, set } = context;
    const requestContext = getRequestContext(request);
    if (!requestContext || SKIPPED_PATHS.has(path)) return;

    const status = typeof set.status === 'number' ? set.status : 200;
    // userId/workspaceId are added by the scoped auth/workspace resolve hooks when the route uses them.
    const { userId, workspaceId } = context as ResolvedActor;
    logger[pickRequestLogLevel(status)](
      {
        requestId: requestContext.requestId,
        method: request.method,
        path,
        status,
        durationMs: Math.round(performance.now() - requestContext.startedAt),
        userId,
        workspaceId
      },
      'request'
    );
  });
