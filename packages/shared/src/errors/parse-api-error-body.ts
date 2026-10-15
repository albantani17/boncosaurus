import { type ApiErrorCode, REQUEST_FAILED } from './api-error';
import { isErrorCode } from './error-codes';

export type ParsedApiError = { code: ApiErrorCode; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function parseApiErrorBody(payload: unknown, status: number): ParsedApiError {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
  return {
    code: isErrorCode(error.code) ? error.code : REQUEST_FAILED,
    message: typeof error.message === 'string' ? error.message : `Request failed with status ${status}`
  };
}
