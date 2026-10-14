import { describe, expect, test } from 'bun:test';
import { chunkText } from './chunk-text';

describe('chunkText', () => {
  test('returns a single chunk when the text fits', () => {
    expect(chunkText('a\nb\nc', 100)).toEqual(['a\nb\nc']);
  });

  test('splits on line boundaries without exceeding the limit', () => {
    expect(chunkText('aaaa\nbbbb\ncccc', 9)).toEqual(['aaaa\nbbbb', 'cccc']);
  });

  test('hard-splits a single line longer than the limit', () => {
    expect(chunkText('abcdefgh', 3)).toEqual(['abc', 'def', 'gh']);
  });

  test('returns no chunks for blank text', () => {
    expect(chunkText('  \n ', 10)).toEqual([]);
  });

  test('drops blank lines between chunks', () => {
    expect(chunkText('aa\n\n\nbb', 5)).toEqual(['aa\nbb']);
  });
});
