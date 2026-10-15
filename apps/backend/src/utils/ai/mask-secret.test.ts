import { describe, expect, test } from 'bun:test';
import { maskSecret } from './mask-secret';

describe('maskSecret', () => {
  test('keeps only the last four characters', () => {
    expect(maskSecret('sk-ant-abcd1234')).toBe('••••1234');
  });

  test('hides short secrets entirely', () => {
    expect(maskSecret('abc')).toBe('••••');
  });
});
