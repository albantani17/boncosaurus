import { describe, expect, test } from 'bun:test';
import { isUniqueViolation } from './is-unique-violation';

describe('isUniqueViolation', () => {
  test('detects the postgres code on the error itself', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  test('detects the postgres code in errno', () => {
    expect(isUniqueViolation({ code: 'ERR_POSTGRES_SERVER_ERROR', errno: '23505' })).toBe(true);
  });

  test('detects the code on a wrapped cause', () => {
    expect(isUniqueViolation(new Error('query failed', { cause: { errno: '23505' } }))).toBe(true);
  });

  test('returns false for other postgres errors', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
  });

  test('returns false for non-object values', () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
  });
});
