import { describe, expect, test } from 'bun:test';
import { createLogger } from './create-logger';

describe('createLogger', () => {
  test('applies the configured level', () => {
    expect(createLogger({ level: 'warn', format: 'json' }).child({}).level).toBe('warn');
  });

  test('builds a pretty logger without throwing', () => {
    expect(createLogger({ level: 'silent', format: 'pretty' }).child({}).level).toBe('silent');
  });
});
