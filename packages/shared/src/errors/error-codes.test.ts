import { describe, expect, test } from 'bun:test';
import { isErrorCode } from './error-codes';

describe('isErrorCode', () => {
  test('accepts a code from the contract', () => {
    expect(isErrorCode('ACCOUNT_NAME_TAKEN')).toBe(true);
  });

  test('rejects an unknown code', () => {
    expect(isErrorCode('ACCOUNT_NAME_TAKN')).toBe(false);
  });

  test.each([undefined, null, 42, {}])('rejects the non-string %p', (value) => {
    expect(isErrorCode(value)).toBe(false);
  });
});
