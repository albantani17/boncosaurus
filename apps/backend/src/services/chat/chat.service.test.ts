import { describe, expect, test } from 'bun:test';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import type { ChatRepository } from '../../repositories/chat.repository';
import type { ChatConversation, ChatMessageRecord, TransactionProposal } from '../../types/ai.types';
import type { Transaction } from '../../types/finance.types';
import { findProposal } from '../../domain/chat/proposal-parts';
import type { AccountWithBalance } from '../account/account.service';
import { createChatService } from './chat.service';
import type { CreateTransactionInput } from '../transaction/transaction.service';

const now = new Date('2026-10-14T08:00:00Z');
const actor = { userId: 'u1', workspaceId: 'ws' };

const draft = {
  type: 'expense' as const,
  accountId: 'acc-1',
  toAccountId: null,
  categoryId: 'cat-1',
  amount: 25_000,
  toAmount: null,
  occurredAt: '2026-10-14T02:00:00.000Z',
  note: 'Kopi'
};

const makeConversation = (overrides: Partial<ChatConversation> = {}): ChatConversation => ({
  id: 'conv-1',
  workspaceId: 'ws',
  userId: 'u1',
  title: null,
  providerId: null,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const proposalMessage = (output: TransactionProposal): ChatMessageRecord => ({
  id: 'msg-a',
  workspaceId: 'ws',
  conversationId: 'conv-1',
  role: 'assistant',
  parts: [
    { type: 'tool-proposeTransaction', toolCallId: 'call-1', state: 'output-available', input: {}, output }
  ],
  createdAt: now
});

const account: AccountWithBalance = {
  id: 'acc-1',
  workspaceId: 'ws',
  name: 'Dompet Hijau',
  type: 'cash',
  currency: 'IDR',
  initialBalance: 0,
  isArchived: false,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
  balance: 0
};

const textStreamModel = (text: string) =>
  new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 't1' },
          { type: 'text-delta', id: 't1', delta: text },
          { type: 'text-end', id: 't1' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 1, text: 1, reasoning: undefined }
            }
          }
        ]
      })
    })
  });

function setup({
  conversations = [makeConversation()],
  messages = [] as ChatMessageRecord[],
  model = textStreamModel('Halo!')
} = {}) {
  const state = { conversations: [...conversations], messages: [...messages] };
  const created: CreateTransactionInput[] = [];
  let nextId = 1;

  const chats: ChatRepository = {
    listConversations: async (workspaceId, userId) =>
      state.conversations.filter((row) => row.workspaceId === workspaceId && row.userId === userId),
    findConversation: async (workspaceId, userId, id) =>
      state.conversations.find((row) => row.workspaceId === workspaceId && row.userId === userId && row.id === id),
    insertConversation: async (values) => {
      const row = makeConversation({ ...values, id: `conv-new-${nextId++}` } as Partial<ChatConversation>);
      state.conversations.push(row);
      return row;
    },
    updateConversation: async (_ws, id, patch) => {
      const index = state.conversations.findIndex((row) => row.id === id);
      state.conversations[index] = { ...state.conversations[index]!, ...patch } as ChatConversation;
      return state.conversations[index];
    },
    deleteConversation: async (_ws, id) => {
      state.conversations = state.conversations.filter((row) => row.id !== id);
    },
    listMessages: async (_ws, conversationId) =>
      state.messages.filter((row) => row.conversationId === conversationId),
    findMessage: async (_ws, conversationId, id) =>
      state.messages.find((row) => row.conversationId === conversationId && row.id === id),
    saveMessage: async (values) => {
      const index = state.messages.findIndex((row) => row.id === values.id);
      const row = { ...values, createdAt: now } as ChatMessageRecord;
      if (index < 0) state.messages.push(row);
      else state.messages[index] = row;
    }
  };

  const service = createChatService({
    chats,
    providers: {
      resolveProvider: async (_ws, candidates) => ({
        providerId: candidates.find(Boolean) ?? 'p-default',
        settings: { kind: 'openai', model: 'gpt-5', baseUrl: null, apiKey: 'k' }
      })
    },
    workspaces: {
      listForUser: async () => [{ id: 'ws', name: 'Keuangan', baseCurrency: 'IDR', role: 'owner' }]
    },
    tools: {
      reports: { getSummary: async (_ws, range) => ({ ...range, totals: [], byCategory: [] }) },
      accounts: { listAccounts: async () => [account] },
      categories: { listCategories: async () => [] },
      transactions: { listTransactions: async () => [], previewTransaction: async () => {} }
    },
    transactions: {
      createTransaction: async (_ws, input) => {
        created.push(input);
        await Bun.sleep(1);
        return { id: `tx-${created.length}` } as Transaction;
      }
    },
    createModel: () => model,
    generateId: () => `id-${nextId++}`,
    now: () => now
  });

  return { service, state, created, model };
}

const drain = async (response: Response) => {
  const body = await response.text();
  await Bun.sleep(5);
  return body;
};

describe('streamReply', () => {
  test('stores the user message and the streamed reply', async () => {
    const { service, state } = setup();

    const body = await drain(
      await service.streamReply(actor, 'conv-1', {
        message: { parts: [{ type: 'text', text: 'Halo dino' }] },
        timeZone: 'Asia/Jakarta'
      })
    );

    expect(body).toContain('Halo!');
    expect(state.messages.map((row) => [row.role, row.parts])).toEqual([
      ['user', [{ type: 'text', text: 'Halo dino' }]],
      ['assistant', expect.arrayContaining([expect.objectContaining({ type: 'text', text: 'Halo!' })])]
    ]);
  });

  test('titles the conversation and remembers the provider', async () => {
    const { service, state } = setup();

    await drain(
      await service.streamReply(actor, 'conv-1', {
        message: { parts: [{ type: 'text', text: 'Pengeluaran bulan ini?' }] },
        providerId: 'p-2'
      })
    );

    expect(state.conversations[0]).toMatchObject({ title: 'Pengeluaran bulan ini?', providerId: 'p-2' });
  });

  test('sends instructions with the workspace accounts', async () => {
    const { service, model } = setup();

    await drain(await service.streamReply(actor, 'conv-1', { message: { parts: [{ type: 'text', text: 'hai' }] } }));

    const [system] = model.doStreamCalls[0]!.prompt;
    expect(system).toMatchObject({ role: 'system' });
    expect(JSON.stringify(system)).toContain('Dompet Hijau');
  });

  test('rejects a message without text', async () => {
    const { service } = setup();
    expect(service.streamReply(actor, 'conv-1', { message: { parts: [] } })).rejects.toMatchObject({
      code: 'EMPTY_MESSAGE'
    });
  });

  test("does not reply in another user's conversation", async () => {
    const { service } = setup({ conversations: [makeConversation({ userId: 'someone-else' })] });
    expect(
      service.streamReply(actor, 'conv-1', { message: { parts: [{ type: 'text', text: 'hai' }] } })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('confirmDraft', () => {
  test('creates the transaction from the stored draft and marks it saved', async () => {
    const { service, state, created } = setup({ messages: [proposalMessage({ status: 'pending', draft })] });

    const result = await service.confirmDraft(actor, 'conv-1', { messageId: 'msg-a', toolCallId: 'call-1' });

    expect(result).toEqual({ transactionId: 'tx-1' });
    expect(created[0]).toMatchObject({ amount: 25_000, source: 'ai', createdBy: 'u1' });
    expect(created[0]?.occurredAt).toEqual(new Date(draft.occurredAt));
    expect(findProposal(state.messages[0]!.parts, 'call-1')).toEqual({ status: 'saved', draft, transactionId: 'tx-1' });
  });

  test('is idempotent, even for concurrent confirmations', async () => {
    const { service, created } = setup({ messages: [proposalMessage({ status: 'pending', draft })] });
    const reference = { messageId: 'msg-a', toolCallId: 'call-1' };

    const results = await Promise.all([
      service.confirmDraft(actor, 'conv-1', reference),
      service.confirmDraft(actor, 'conv-1', reference)
    ]);

    expect(created).toHaveLength(1);
    expect(results).toEqual([{ transactionId: 'tx-1' }, { transactionId: 'tx-1' }]);
  });

  test('refuses a dismissed draft', async () => {
    const { service } = setup({ messages: [proposalMessage({ status: 'dismissed', draft })] });
    expect(
      service.confirmDraft(actor, 'conv-1', { messageId: 'msg-a', toolCallId: 'call-1' })
    ).rejects.toMatchObject({ status: 409, code: 'DRAFT_NOT_PENDING' });
  });

  test('throws NOT_FOUND for an unknown tool call', async () => {
    const { service } = setup({ messages: [proposalMessage({ status: 'pending', draft })] });
    expect(
      service.confirmDraft(actor, 'conv-1', { messageId: 'msg-a', toolCallId: 'other' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('dismissDraft', () => {
  test('marks a pending draft as dismissed', async () => {
    const { service, state, created } = setup({ messages: [proposalMessage({ status: 'pending', draft })] });

    await service.dismissDraft(actor, 'conv-1', { messageId: 'msg-a', toolCallId: 'call-1' });

    expect(findProposal(state.messages[0]!.parts, 'call-1')).toEqual({ status: 'dismissed', draft });
    expect(created).toEqual([]);
  });
});

describe('conversations', () => {
  test('lists only the caller conversations', async () => {
    const { service } = setup({
      conversations: [makeConversation(), makeConversation({ id: 'conv-2', userId: 'u2' })]
    });
    expect((await service.listConversations(actor)).map((row) => row.id)).toEqual(['conv-1']);
  });

  test('returns a conversation with its messages', async () => {
    const { service } = setup({ messages: [proposalMessage({ status: 'pending', draft })] });

    const conversation = await service.getConversation(actor, 'conv-1');

    expect(conversation.messages).toEqual([
      { id: 'msg-a', role: 'assistant', parts: proposalMessage({ status: 'pending', draft }).parts, createdAt: now }
    ]);
  });
});
