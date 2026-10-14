import { describe, expect, test } from 'bun:test';
import { parseAiConfig } from './parse-ai-config';

const VALID_KEY = Buffer.alloc(32, 7).toString('base64');

describe('parseAiConfig', () => {
  test('returns a null key when AI_SECRET_KEY is not set', () => {
    expect(parseAiConfig({})).toEqual({ secretKey: null });
  });

  test('treats a blank AI_SECRET_KEY as not set', () => {
    expect(parseAiConfig({ AI_SECRET_KEY: '  ' })).toEqual({ secretKey: null });
  });

  test('decodes a 32-byte base64 key', () => {
    expect(parseAiConfig({ AI_SECRET_KEY: VALID_KEY }).secretKey?.length).toBe(32);
  });

  test('throws when the decoded key is not 32 bytes', () => {
    const shortKey = Buffer.alloc(16).toString('base64');
    expect(() => parseAiConfig({ AI_SECRET_KEY: shortKey })).toThrow('AI_SECRET_KEY');
  });
});
