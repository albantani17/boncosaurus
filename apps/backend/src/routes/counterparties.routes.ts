import { Elysia } from 'elysia';
import { counterpartyService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createCounterpartyBody, updateCounterpartyBody } from '../schemas/counterparty.schema';
import { idParams } from '../schemas/id-params.schema';

export const counterpartyRoutes = new Elysia({ prefix: '/counterparties' })
  .use(workspacePlugin)
  .get('/', ({ workspaceId }) => counterpartyService.listCounterparties(workspaceId))
  .post(
    '/',
    async ({ workspaceId, body, set }) => {
      set.status = 201;
      return counterpartyService.createCounterparty(workspaceId, body);
    },
    { body: createCounterpartyBody }
  )
  .patch(
    '/:id',
    ({ workspaceId, params, body }) => counterpartyService.updateCounterparty(workspaceId, params.id, body),
    { params: idParams, body: updateCounterpartyBody }
  )
  .delete(
    '/:id',
    async ({ workspaceId, params, set }) => {
      await counterpartyService.deleteCounterparty(workspaceId, params.id);
      set.status = 204;
    },
    { params: idParams }
  );
