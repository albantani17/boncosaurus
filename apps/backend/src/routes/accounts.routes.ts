import { Elysia } from 'elysia';
import { accountService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createAccountBody, updateAccountBody } from '../schemas/account.schema';
import { idParams } from '../schemas/id-params.schema';

export const accountRoutes = new Elysia({ prefix: '/accounts' })
  .use(workspacePlugin)
  .get('/', ({ workspaceId }) => accountService.listAccounts(workspaceId))
  .post(
    '/',
    async ({ workspaceId, body, set }) => {
      set.status = 201;
      return accountService.createAccount(workspaceId, body);
    },
    { body: createAccountBody }
  )
  .get('/:id', ({ workspaceId, params }) => accountService.getAccount(workspaceId, params.id), {
    params: idParams
  })
  .patch(
    '/:id',
    ({ workspaceId, params, body }) => accountService.updateAccount(workspaceId, params.id, body),
    { params: idParams, body: updateAccountBody }
  )
  .delete(
    '/:id',
    async ({ workspaceId, params, set }) => {
      await accountService.deleteAccount(workspaceId, params.id);
      set.status = 204;
    },
    { params: idParams }
  );
