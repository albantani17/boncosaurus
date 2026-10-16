import {
  type LanguageModel,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages
} from 'ai';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/app-error';
import type { ChatRepository } from '../../repositories/chat.repository';
import type { WorkspaceRepository } from '../../repositories/workspace.repository';
import type { ChatConversation, ChatMessageRecord } from '../../types/ai.types';
import type { ServiceLogger } from '../../types/logger.types';
import { buildChatSystemPrompt } from '../../domain/chat/build-chat-system-prompt';
import type { LanguageModelSettings } from '../../integrations/ai/create-language-model';
import { deriveConversationTitle } from '../../domain/chat/derive-conversation-title';
import { describeProviderError } from '../../integrations/ai/describe-provider-error';
import { describeZonedNow } from '../../utils/describe-zoned-now';
import { type AnyProposal, findProposal, replaceProposal, savedRecordOf } from '../../domain/chat/proposal-parts';
import { toUserTextParts } from '../../domain/chat/to-user-text-parts';
import type { ActorContext, AiProviderService } from '../ai-provider/ai-provider.service';
import { type ChatToolDependencies, createChatTools } from './chat-tools';
import type { ProposalActions } from './proposal-actions';

export type ChatMessage = Pick<ChatMessageRecord, 'id' | 'role' | 'parts' | 'createdAt'>;
export type ConversationWithMessages = ChatConversation & { messages: ChatMessage[] };

export type SendMessageInput = { message: { parts?: unknown }; providerId?: string; timeZone?: string };
export type DraftReference = { messageId: string; toolCallId: string };

type Dependencies = {
  chats: ChatRepository;
  providers: Pick<AiProviderService, 'resolveProvider'>;
  workspaces: Pick<WorkspaceRepository, 'listForUser'>;
  tools: ChatToolDependencies;
  proposals: Pick<ProposalActions, 'save'>;
  createModel: (settings: LanguageModelSettings) => LanguageModel;
  generateId: () => string;
  now: () => Date;
  logger: ServiceLogger;
};

const MAX_STEPS = 6;
const DEFAULT_TIME_ZONE = 'UTC';

const toUIMessage = (message: ChatMessageRecord) =>
  ({ id: message.id, role: message.role, parts: message.parts }) as UIMessage;

export function createChatService(deps: Dependencies) {
  const { chats } = deps;
  const draftLocks = new Map<string, Promise<unknown>>();

  async function requireConversation({ userId, workspaceId }: ActorContext, id: string) {
    const conversation = await chats.findConversation(workspaceId, userId, id);
    if (!conversation) throw new NotFoundError('Conversation');
    return conversation;
  }

  async function requireBaseCurrency({ userId, workspaceId }: ActorContext) {
    const membership = (await deps.workspaces.listForUser(userId)).find((row) => row.id === workspaceId);
    if (!membership) throw new ForbiddenError('NOT_A_MEMBER', 'You are not a member of this workspace');
    return membership.baseCurrency;
  }

  // Stored tool parts can stop matching the tool schemas after an upgrade; keep the chat usable then.
  async function validateHistory(messages: UIMessage[], tools: ReturnType<typeof createChatTools>) {
    try {
      return await validateUIMessages({ messages, tools });
    } catch (error) {
      deps.logger.warn({ event: 'chat.history_invalid', err: error }, 'stored chat history no longer validates');
      return messages.slice(-1);
    }
  }

  async function buildInstructions(actor: ActorContext, timeZone: string) {
    const [baseCurrency, accounts, categories] = await Promise.all([
      requireBaseCurrency(actor),
      deps.tools.accounts.listAccounts(actor.workspaceId),
      deps.tools.categories.listCategories(actor.workspaceId)
    ]);
    return buildChatSystemPrompt({
      now: describeZonedNow(deps.now(), timeZone),
      timeZone,
      baseCurrency,
      accounts: accounts.filter((account) => !account.isArchived),
      categories: categories.filter((category) => !category.isArchived)
    });
  }

  async function requireProposal(actor: ActorContext, conversationId: string, draft: DraftReference) {
    await requireConversation(actor, conversationId);
    const message = await chats.findMessage(actor.workspaceId, conversationId, draft.messageId);
    const stored = message ? findProposal(message.parts, draft.toolCallId) : null;
    if (!message || !stored) throw new NotFoundError('Draft');
    return { message, ...stored };
  }

  async function storeProposal(message: ChatMessageRecord, toolCallId: string, proposal: AnyProposal) {
    await chats.saveMessage({ ...message, parts: replaceProposal(message.parts, toolCallId, proposal) });
  }

  // One confirmation per draft at a time, so a double click cannot save a draft twice.
  async function withDraftLock<T>(key: string, run: () => Promise<T>): Promise<T> {
    while (draftLocks.has(key)) await draftLocks.get(key)!.catch(() => undefined);
    const running = run();
    draftLocks.set(key, running);
    try {
      return await running;
    } finally {
      draftLocks.delete(key);
    }
  }

  return {
    listConversations: ({ userId, workspaceId }: ActorContext) => chats.listConversations(workspaceId, userId),

    async getConversation(actor: ActorContext, id: string): Promise<ConversationWithMessages> {
      const conversation = await requireConversation(actor, id);
      const messages = await chats.listMessages(actor.workspaceId, id);
      return {
        ...conversation,
        messages: messages.map(({ id, role, parts, createdAt }) => ({ id, role, parts, createdAt }))
      };
    },

    createConversation: ({ userId, workspaceId }: ActorContext, input: { providerId?: string } = {}) =>
      chats.insertConversation({ workspaceId, userId, providerId: input.providerId ?? null }),

    async renameConversation(actor: ActorContext, id: string, title: string): Promise<ChatConversation> {
      await requireConversation(actor, id);
      const updated = await chats.updateConversation(actor.workspaceId, id, { title: title.trim() });
      if (!updated) throw new NotFoundError('Conversation');
      return updated;
    },

    async deleteConversation(actor: ActorContext, id: string): Promise<void> {
      await requireConversation(actor, id);
      await chats.deleteConversation(actor.workspaceId, id);
    },

    async streamReply(actor: ActorContext, conversationId: string, input: SendMessageInput): Promise<Response> {
      const conversation = await requireConversation(actor, conversationId);
      const parts = toUserTextParts(input.message.parts);
      if (!parts) throw new BadRequestError('EMPTY_MESSAGE', 'Message must contain text');

      const provider = await deps.providers.resolveProvider(actor.workspaceId, [
        input.providerId,
        conversation.providerId
      ]);
      const tools = createChatTools(deps.tools, actor.workspaceId);
      const [history, instructions] = await Promise.all([
        chats.listMessages(actor.workspaceId, conversationId),
        buildInstructions(actor, input.timeZone ?? DEFAULT_TIME_ZONE)
      ]);

      const userMessage = { id: deps.generateId(), role: 'user', parts } as UIMessage;
      await chats.saveMessage({ ...userMessage, workspaceId: actor.workspaceId, conversationId, role: 'user' });
      await chats.updateConversation(actor.workspaceId, conversationId, {
        providerId: provider.providerId,
        ...(conversation.title ? {} : { title: deriveConversationTitle(parts[0]!.text) })
      });

      const messages = await validateHistory([...history.map(toUIMessage), userMessage], tools);
      const result = streamText({
        model: deps.createModel(provider.settings),
        instructions,
        messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
        tools,
        stopWhen: isStepCount(MAX_STEPS)
      });
      // Keep generating (and saving) even if the browser disconnects mid-stream.
      result.consumeStream();

      return createUIMessageStreamResponse({
        stream: toUIMessageStream({
          stream: result.stream,
          tools,
          originalMessages: messages,
          generateMessageId: deps.generateId,
          onError: (error) => {
            deps.logger.error(
              { event: 'chat.stream_failed', err: error, conversationId, workspaceId: actor.workspaceId },
              'chat stream failed'
            );
            return describeProviderError(error);
          },
          onEnd: async ({ responseMessage }) => {
            if (responseMessage.parts.length === 0) return;
            try {
              await chats.saveMessage({
                id: responseMessage.id,
                workspaceId: actor.workspaceId,
                conversationId,
                role: 'assistant',
                parts: responseMessage.parts
              });
            } catch (error) {
              deps.logger.error(
                { event: 'chat.save_failed', err: error, conversationId, workspaceId: actor.workspaceId },
                'failed to save the assistant message'
              );
            }
          }
        })
      });
    },

    confirmDraft(actor: ActorContext, conversationId: string, draft: DraftReference) {
      return withDraftLock(`${draft.messageId}:${draft.toolCallId}`, async () => {
        const { message, toolName, proposal } = await requireProposal(actor, conversationId, draft);
        if (proposal.status === 'saved') return savedRecordOf(proposal);
        if (proposal.status !== 'pending') {
          throw new ConflictError('DRAFT_NOT_PENDING', 'This draft can no longer be saved');
        }

        const record = await deps.proposals.save(actor, toolName, proposal.draft);
        await storeProposal(message, draft.toolCallId, { status: 'saved', draft: proposal.draft, ...record } as AnyProposal);
        return record;
      });
    },

    dismissDraft(actor: ActorContext, conversationId: string, draft: DraftReference) {
      return withDraftLock(`${draft.messageId}:${draft.toolCallId}`, async () => {
        const { message, proposal } = await requireProposal(actor, conversationId, draft);
        if (proposal.status === 'dismissed') return;
        if (proposal.status !== 'pending') {
          throw new ConflictError('DRAFT_NOT_PENDING', 'This draft can no longer be dismissed');
        }
        await storeProposal(message, draft.toolCallId, { status: 'dismissed', draft: proposal.draft } as AnyProposal);
      });
    }
  };
}
