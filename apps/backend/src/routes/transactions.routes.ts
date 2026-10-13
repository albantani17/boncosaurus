import { Elysia } from 'elysia';
import { transactionService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { idParams } from '../schemas/id-params.schema';
import {
  createTransactionBody,
  listTransactionsQuery,
  updateTransactionBody
} from '../schemas/transaction.schema';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
  .use(workspacePlugin)
  .get(
    '/',
    ({ workspaceId, query }) => transactionService.listTransactions(workspaceId, query),
    { query: listTransactionsQuery }
  )
  .post(
    '/',
    async ({ workspaceId, userId, body, set }) => {
      set.status = 201;
      return transactionService.createTransaction(workspaceId, { ...body, createdBy: userId });
    },
    { body: createTransactionBody }
  )
  .get(
    '/:id',
    ({ workspaceId, params }) => transactionService.getTransaction(workspaceId, params.id),
    { params: idParams }
  )
  .patch(
    '/:id',
    ({ workspaceId, params, body }) =>
      transactionService.updateTransaction(workspaceId, params.id, body),
    { params: idParams, body: updateTransactionBody }
  )
  .delete(
    '/:id',
    async ({ workspaceId, params, set }) => {
      await transactionService.deleteTransaction(workspaceId, params.id);
      set.status = 204;
    },
    { params: idParams }
  );
