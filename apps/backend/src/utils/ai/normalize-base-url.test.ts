import { describe, expect, test } from 'bun:test';
import { normalizeBaseUrl } from './normalize-base-url';

describe('normalizeBaseUrl', () => {
  test('keeps an http url and drops the trailing slash', () => {
    expect(normalizeBaseUrl(' http://localhost:11434/v1/ ')).toBe('http://localhost:11434/v1');
  });

  test('accepts https urls', () => {
    expect(normalizeBaseUrl('https://openrouter.ai/api/v1')).toBe('https://openrouter.ai/api/v1');
  });

  test('rejects other protocols', () => {
    expect(normalizeBaseUrl('file:///etc/passwd')).toBeNull();
  });

  test('rejects text that is not a url', () => {
    expect(normalizeBaseUrl('localhost')).toBeNull();
  });
});
