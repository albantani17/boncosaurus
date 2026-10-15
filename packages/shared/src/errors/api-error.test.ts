import { describe, expect, test } from 'bun:test';
import { ApiError } from './api-error';

describe('ApiError', () => {
  test('keeps the status, code and message', () => {
    const error = new ApiError(409, 'ACCOUNT_NAME_TAKEN', 'Name taken');

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ status: 409, code: 'ACCOUNT_NAME_TAKEN', message: 'Name taken' });
  });
});
