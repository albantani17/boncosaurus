import type { ErrorCode } from '@boncosaurus/shared';

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string
  ) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(400, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(409, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(403, code, message);
  }
}

export class BadGatewayError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(502, code, message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(503, code, message);
  }
}
