import { describe, expect, test } from 'bun:test';
import { parseLogConfig } from './parse-log-config';

describe('parseLogConfig', () => {
  test('defaults to info and pretty output in development', () => {
    expect(parseLogConfig({})).toEqual({ level: 'info', format: 'pretty' });
  });

  test('defaults to json output in production', () => {
    expect(parseLogConfig({ NODE_ENV: 'production' }).format).toBe('json');
  });

  test('accepts an explicit level and format regardless of case', () => {
    expect(parseLogConfig({ LOG_LEVEL: 'DEBUG', LOG_FORMAT: ' json ' })).toEqual({ level: 'debug', format: 'json' });
  });

  test('treats blank values as not set', () => {
    expect(parseLogConfig({ LOG_LEVEL: ' ', LOG_FORMAT: '' })).toEqual({ level: 'info', format: 'pretty' });
  });

  test('throws on an unknown level', () => {
    expect(() => parseLogConfig({ LOG_LEVEL: 'verbose' })).toThrow('LOG_LEVEL');
  });

  test('throws on an unknown format', () => {
    expect(() => parseLogConfig({ LOG_FORMAT: 'xml' })).toThrow('LOG_FORMAT');
  });
});
