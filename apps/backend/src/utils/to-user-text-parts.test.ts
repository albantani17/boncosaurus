import { describe, expect, test } from 'bun:test';
import { toUserTextParts } from './to-user-text-parts';

describe('toUserTextParts', () => {
  test('joins text parts into one trimmed part', () => {
    expect(toUserTextParts([{ type: 'text', text: ' halo ' }, { type: 'text', text: 'dino' }])).toEqual([
      { type: 'text', text: 'halo \ndino' }
    ]);
  });

  test('drops non-text parts', () => {
    const parts = [{ type: 'tool-proposeTransaction', output: {} }, { type: 'text', text: 'hai' }];
    expect(toUserTextParts(parts)).toEqual([{ type: 'text', text: 'hai' }]);
  });

  test('returns null for empty or oversized messages', () => {
    expect(toUserTextParts([{ type: 'text', text: '  ' }])).toBeNull();
    expect(toUserTextParts([{ type: 'text', text: 'x'.repeat(4001) }])).toBeNull();
    expect(toUserTextParts('nope')).toBeNull();
  });
});
