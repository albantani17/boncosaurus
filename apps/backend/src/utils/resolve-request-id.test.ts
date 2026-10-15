import { describe, expect, test } from 'bun:test';
import { resolveRequestId } from './resolve-request-id';

const generateId = () => 'generated';

describe('resolveRequestId', () => {
  test('keeps a well-formed incoming id', () => {
    expect(resolveRequestId('abc-123_DEF', generateId)).toBe('abc-123_DEF');
  });

  test('generates an id when the header is missing', () => {
    expect(resolveRequestId(null, generateId)).toBe('generated');
  });

  test('generates an id when the header has unsafe characters', () => {
    expect(resolveRequestId('abc\ninjected', generateId)).toBe('generated');
  });

  test('generates an id when the header is too long', () => {
    expect(resolveRequestId('a'.repeat(65), generateId)).toBe('generated');
  });
});
