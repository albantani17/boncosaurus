import { describe, expect, test } from 'bun:test';
import { describeProviderError } from './describe-provider-error';

describe('describeProviderError', () => {
  test('uses the error message', () => {
    expect(describeProviderError(new Error('Invalid API key'))).toBe('Invalid API key');
  });

  test('truncates long messages', () => {
    expect(describeProviderError(new Error('x'.repeat(400)))).toHaveLength(301);
  });

  test('falls back for non-errors and empty messages', () => {
    expect(describeProviderError('boom')).toBe('The AI provider did not respond');
    expect(describeProviderError(new Error(' '))).toBe('The AI provider did not respond');
  });
});
