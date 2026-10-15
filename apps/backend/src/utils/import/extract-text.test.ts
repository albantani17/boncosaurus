import { describe, expect, test } from 'bun:test';
import { extractText } from './extract-text';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('extractText', () => {
  test('returns plain text unchanged', () => {
    expect(extractText(bytes('Kopi 25.000'))).toEqual({ kind: 'text', text: 'Kopi 25.000' });
  });

  test('pretty-prints JSON so it can be split on line boundaries', () => {
    expect(extractText(bytes('{"a":1}'))).toEqual({ kind: 'text', text: '{\n  "a": 1\n}' });
  });

  test('keeps text that looks like JSON but is not valid', () => {
    expect(extractText(bytes('{oops'))).toEqual({ kind: 'text', text: '{oops' });
  });

  test('strips a UTF-8 byte order mark', () => {
    expect(extractText(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('hi')]))).toEqual({ kind: 'text', text: 'hi' });
  });

  test('rejects blank content', () => {
    expect(() => extractText(bytes('  \n'))).toThrow('The file is empty');
  });
});
