import { describe, expect, test } from 'bun:test';
import { parseApiErrorBody } from './parse-api-error-body';

describe('parseApiErrorBody', () => {
  test('reads the code and message of a backend error body', () => {
    const body = { error: { code: 'ACCOUNT_NAME_TAKEN', message: 'Name taken' } };
    expect(parseApiErrorBody(body, 409)).toEqual({ code: 'ACCOUNT_NAME_TAKEN', message: 'Name taken' });
  });

  test('falls back to REQUEST_FAILED for a code the contract does not know', () => {
    const body = { error: { code: 'SOMETHING_NEW', message: 'Odd' } };
    expect(parseApiErrorBody(body, 400)).toEqual({ code: 'REQUEST_FAILED', message: 'Odd' });
  });

  test('builds a message from the status when the body has none', () => {
    expect(parseApiErrorBody({ error: { code: 'NOT_FOUND' } }, 404)).toEqual({
      code: 'NOT_FOUND',
      message: 'Request failed with status 404'
    });
  });

  test.each([null, undefined, 'Bad Gateway', 42, { error: null }, { message: 'x' }])(
    'treats %p as an unknown failure',
    (payload) => {
      expect(parseApiErrorBody(payload, 502)).toEqual({
        code: 'REQUEST_FAILED',
        message: 'Request failed with status 502'
      });
    }
  );
});
