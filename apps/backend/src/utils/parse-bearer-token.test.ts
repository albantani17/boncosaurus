import { describe, expect, test } from 'bun:test';
import { parseBearerToken } from './parse-bearer-token';

describe('parseBearerToken', () => {
  test('extracts the token from a Bearer header', () => {
    expect(parseBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  test('is case-insensitive about the scheme', () => {
    expect(parseBearerToken('bearer abc')).toBe('abc');
  });

  test('returns null when the header is missing', () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  test('returns null for other schemes', () => {
    expect(parseBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
  });

  test('returns null when the token part is empty', () => {
    expect(parseBearerToken('Bearer ')).toBeNull();
  });
});
