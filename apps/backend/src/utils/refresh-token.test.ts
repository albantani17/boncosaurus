import { describe, expect, test } from 'bun:test';
import { generateRefreshToken, hashRefreshToken } from './refresh-token';

describe('generateRefreshToken', () => {
  test('returns a url-safe token of 43 characters (32 bytes)', () => {
    expect(generateRefreshToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test('returns a different token each time', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe('hashRefreshToken', () => {
  test('is deterministic for the same token', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
  });

  test('differs for different tokens', () => {
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'));
  });

  test('returns a 64-character hex digest and never the raw token', () => {
    const hash = hashRefreshToken('abc');

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('abc');
  });
});
