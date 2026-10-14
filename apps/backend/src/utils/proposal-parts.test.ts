import { describe, expect, test } from 'bun:test';
import type { TransactionProposal } from '../types/ai.types';
import { findProposal, replaceProposal } from './proposal-parts';

const draft = {
  type: 'expense' as const,
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 25_000,
  toAmount: null,
  occurredAt: '2026-10-14T02:00:00.000Z',
  note: null
};
const pending: TransactionProposal = { status: 'pending', draft };
const parts = [
  { type: 'text', text: 'Siap' },
  { type: 'tool-proposeTransaction', toolCallId: 'call-1', state: 'output-available', input: {}, output: pending },
  { type: 'tool-getSummary', toolCallId: 'call-2', state: 'output-available', input: {}, output: {} }
];

describe('findProposal', () => {
  test('finds the proposal output by tool call id', () => {
    expect(findProposal(parts, 'call-1')).toEqual(pending);
  });

  test('ignores other tools and unknown ids', () => {
    expect(findProposal(parts, 'call-2')).toBeNull();
    expect(findProposal(parts, 'missing')).toBeNull();
  });

  test('ignores proposals that are still streaming', () => {
    const streaming = [{ type: 'tool-proposeTransaction', toolCallId: 'call-1', state: 'input-available' }];
    expect(findProposal(streaming, 'call-1')).toBeNull();
  });
});

describe('replaceProposal', () => {
  test('replaces only the matching output', () => {
    const saved: TransactionProposal = { status: 'saved', draft, transactionId: 'tx-1' };

    const updated = replaceProposal(parts, 'call-1', saved);

    expect(findProposal(updated, 'call-1')).toEqual(saved);
    expect(updated[0]).toBe(parts[0]);
    expect(updated[2]).toBe(parts[2]);
  });
});
