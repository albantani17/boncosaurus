import { describe, expect, test } from 'bun:test';
import { pickRequestLogLevel } from './pick-request-log-level';

describe('pickRequestLogLevel', () => {
  test.each([200, 302, 401, 422])('logs status %p as info', (status) => {
    expect(pickRequestLogLevel(status)).toBe('info');
  });

  test.each([500, 502, 503])('logs status %p as error', (status) => {
    expect(pickRequestLogLevel(status)).toBe('error');
  });
});
