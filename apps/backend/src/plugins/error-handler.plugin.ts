import type { ApiErrorBody } from '@boncosaurus/shared';
import { Elysia } from 'elysia';
import { logger } from '../container';
import { AppError } from '../errors/app-error';
import { getRequestContext } from './request-context';

// Elysia already answers these with a proper 4xx; everything else is a bug or an outage.
const PASSTHROUGH_CODES = new Set<unknown>(['NOT_FOUND', 'PARSE', 'INVALID_COOKIE_SIGNATURE', 'INVALID_FILE_TYPE']);

export const errorHandlerPlugin = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ error, code, set, request, path }): ApiErrorBody | undefined => {
    if (error instanceof AppError) {
      set.status = error.status;
      return { error: { code: error.code, message: error.message } };
    }
    if (code === 'VALIDATION') {
      set.status = 422;
      const message = error.all.map((issue) => issue.summary ?? issue.message).join('; ');
      return { error: { code: 'VALIDATION_ERROR', message } };
    }
    if (PASSTHROUGH_CODES.has(code)) return;

    logger.error(
      { err: error, requestId: getRequestContext(request)?.requestId, method: request.method, path },
      'unhandled error'
    );
    set.status = 500;
    return { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
  }
);
