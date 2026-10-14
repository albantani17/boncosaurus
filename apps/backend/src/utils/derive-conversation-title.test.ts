import { describe, expect, test } from 'bun:test';
import { deriveConversationTitle } from './derive-conversation-title';

describe('deriveConversationTitle', () => {
  test('collapses whitespace', () => {
    expect(deriveConversationTitle('  Pengeluaran\n bulan ini? ')).toBe('Pengeluaran bulan ini?');
  });

  test('truncates long text to 60 characters', () => {
    const title = deriveConversationTitle('a'.repeat(100));
    expect(title).toHaveLength(60);
    expect(title?.endsWith('…')).toBe(true);
  });

  test('returns null for blank text', () => {
    expect(deriveConversationTitle('   ')).toBeNull();
  });
});
