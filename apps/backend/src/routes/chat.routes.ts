import { Elysia } from 'elysia';
import { chatService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createConversationBody, draftBody, renameConversationBody, sendMessageBody } from '../schemas/chat.schema';
import { idParams } from '../schemas/id-params.schema';

export const chatRoutes = new Elysia({ prefix: '/chat/conversations' })
  .use(workspacePlugin)
  .get('/', ({ userId, workspaceId }) => chatService.listConversations({ userId, workspaceId }))
  .post(
    '/',
    async ({ userId, workspaceId, body, set }) => {
      set.status = 201;
      return chatService.createConversation({ userId, workspaceId }, body);
    },
    { body: createConversationBody }
  )
  .get('/:id', ({ userId, workspaceId, params }) => chatService.getConversation({ userId, workspaceId }, params.id), {
    params: idParams
  })
  .patch(
    '/:id',
    ({ userId, workspaceId, params, body }) =>
      chatService.renameConversation({ userId, workspaceId }, params.id, body.title),
    { params: idParams, body: renameConversationBody }
  )
  .delete(
    '/:id',
    async ({ userId, workspaceId, params, set }) => {
      await chatService.deleteConversation({ userId, workspaceId }, params.id);
      set.status = 204;
    },
    { params: idParams }
  )
  .post(
    '/:id/messages',
    ({ userId, workspaceId, params, body }) => chatService.streamReply({ userId, workspaceId }, params.id, body),
    { params: idParams, body: sendMessageBody }
  )
  .post(
    '/:id/drafts/confirm',
    ({ userId, workspaceId, params, body }) => chatService.confirmDraft({ userId, workspaceId }, params.id, body),
    { params: idParams, body: draftBody }
  )
  .post(
    '/:id/drafts/dismiss',
    async ({ userId, workspaceId, params, body, set }) => {
      await chatService.dismissDraft({ userId, workspaceId }, params.id, body);
      set.status = 204;
    },
    { params: idParams, body: draftBody }
  );
