import type { ErrorCode } from './error-codes';

export const REQUEST_FAILED = 'REQUEST_FAILED';

// Raised by API clients for failures that never produced a backend error body.
export const CLIENT_ERROR_CODES = [REQUEST_FAILED, 'MISSING_REFRESH_TOKEN'] as const;

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];

export type ApiErrorCode = ErrorCode | ClientErrorCode;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string
  ) {
    super(message);
  }
}
