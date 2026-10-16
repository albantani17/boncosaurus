import { describe, expect, test } from 'bun:test';
import { isGonePushError } from './is-gone-push-error';

describe('isGonePushError', () => {
  test.each([404, 410])('treats status %p as an expired subscription', (statusCode) => {
    expect(isGonePushError({ statusCode })).toBe(true);
  });

  test('keeps other failures', () => {
    expect(isGonePushError({ statusCode: 500 })).toBe(false);
    expect(isGonePushError(new Error('timeout'))).toBe(false);
    expect(isGonePushError(null)).toBe(false);
    expect(isGonePushError('410')).toBe(false);
  });
});
