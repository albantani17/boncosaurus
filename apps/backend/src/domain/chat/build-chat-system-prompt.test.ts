import { describe, expect, test } from 'bun:test';
import { buildChatSystemPrompt } from './build-chat-system-prompt';

const base = {
  now: { iso: '2026-10-14T15:30:00+07:00', offset: '+07:00', weekday: 'Rabu' },
  timeZone: 'Asia/Jakarta',
  baseCurrency: 'IDR',
  accounts: [{ id: 'acc-1', name: 'Cash', type: 'cash', currency: 'IDR' }],
  categories: [
    { id: 'cat-1', name: 'Makanan', type: 'expense', parentId: null },
    { id: 'cat-2', name: 'Kopi', type: 'expense', parentId: 'cat-1' }
  ]
};

describe('buildChatSystemPrompt', () => {
  test('includes the current time, offset and base currency', () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain('2026-10-14T15:30:00+07:00 (Rabu, zona waktu Asia/Jakarta)');
    expect(prompt).toContain('YYYY-MM-DDT00:00:00+07:00');
    expect(prompt).toContain('Mata uang utama workspace: IDR');
  });

  test('lists accounts and categories with their ids', () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain('- Cash (id: acc-1, jenis: cash, mata uang: IDR)');
    expect(prompt).toContain('- Makanan › Kopi (id: cat-2, tipe: expense)');
  });

  test('marks empty lists', () => {
    const prompt = buildChatSystemPrompt({ ...base, accounts: [], categories: [] });
    expect(prompt).toContain('Akun:\n- (belum ada)');
  });

  test('explains when to use each debt tool', () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain('proposeTransaction type "expense" dengan splits');
    expect(prompt).toContain('lalu proposeDebtPayment');
    expect(prompt).toContain('proposeDebtWriteOff');
  });
});
