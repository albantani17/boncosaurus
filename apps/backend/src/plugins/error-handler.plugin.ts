import type { ApiErrorBody } from '@boncosaurus/shared';
import { Elysia } from 'elysia';
import { AppError } from '../errors/app-error';

export const errorHandlerPlugin = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ error, code, set }): ApiErrorBody | undefined => {
    if (error instanceof AppError) {
      set.status = error.status;
      return { error: { code: error.code, message: error.message } };
    }
    if (code === 'VALIDATION') {
      set.status = 422;
      const message = error.all.map((issue) => issue.summary ?? issue.message).join('; ');
      return { error: { code: 'VALIDATION_ERROR', message } };
    }
  }
);
