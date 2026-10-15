import type { ErrorCode } from './error-codes';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };
