import { Elysia } from 'elysia';
import { aiProviderService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createAiProviderBody, listModelsBody, updateAiProviderBody } from '../schemas/ai-provider.schema';
import { idParams } from '../schemas/id-params.schema';

export const aiProviderRoutes = new Elysia({ prefix: '/ai/providers' })
  .use(workspacePlugin)
  .get('/', ({ workspaceId }) => aiProviderService.listProviders(workspaceId))
  .post(
    '/',
    async ({ userId, workspaceId, body, set }) => {
      set.status = 201;
      return aiProviderService.createProvider({ userId, workspaceId }, body);
    },
    { body: createAiProviderBody }
  )
  .post(
    '/models',
    ({ userId, workspaceId, body }) => aiProviderService.listModels({ userId, workspaceId }, body),
    { body: listModelsBody }
  )
  .patch(
    '/:id',
    ({ userId, workspaceId, params, body }) =>
      aiProviderService.updateProvider({ userId, workspaceId }, params.id, body),
    { params: idParams, body: updateAiProviderBody }
  )
  .delete(
    '/:id',
    async ({ userId, workspaceId, params, set }) => {
      await aiProviderService.deleteProvider({ userId, workspaceId }, params.id);
      set.status = 204;
    },
    { params: idParams }
  )
  .post(
    '/:id/default',
    async ({ userId, workspaceId, params, set }) => {
      await aiProviderService.setDefaultProvider({ userId, workspaceId }, params.id);
      set.status = 204;
    },
    { params: idParams }
  )
  .post(
    '/:id/test',
    ({ userId, workspaceId, params }) => aiProviderService.testProvider({ userId, workspaceId }, params.id),
    { params: idParams }
  );
