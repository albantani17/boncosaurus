const UNIQUE_VIOLATION_CODE = '23505';

type ErrorLike = { code?: unknown; errno?: unknown; cause?: unknown };

const hasUniqueViolationCode = (error: ErrorLike) =>
  error.code === UNIQUE_VIOLATION_CODE || error.errno === UNIQUE_VIOLATION_CODE;

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { cause } = error as ErrorLike;
  return hasUniqueViolationCode(error) || (cause !== undefined && isUniqueViolation(cause));
}
