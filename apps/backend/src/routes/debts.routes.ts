import { Elysia } from 'elysia';
import { debtPaymentService, debtService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { createDebtPaymentBody, debtPaymentParams } from '../schemas/debt-payment.schema';
import { createDebtBody, listDebtsQuery, updateDebtBody } from '../schemas/debt.schema';
import { idParams } from '../schemas/id-params.schema';

export const debtRoutes = new Elysia({ prefix: '/debts' })
  .use(workspacePlugin)
  .get('/', ({ workspaceId, query }) => debtService.listDebts(workspaceId, query), { query: listDebtsQuery })
  .get('/summary', ({ workspaceId }) => debtService.getSummary(workspaceId))
  .get('/reminders', ({ workspaceId }) => debtService.listReminders(workspaceId))
  .post(
    '/',
    async ({ workspaceId, userId, body, set }) => {
      set.status = 201;
      return debtService.createDebt(workspaceId, { ...body, createdBy: userId });
    },
    { body: createDebtBody }
  )
  .get('/:id', ({ workspaceId, params }) => debtService.getDebt(workspaceId, params.id), { params: idParams })
  .patch('/:id', ({ workspaceId, params, body }) => debtService.updateDebt(workspaceId, params.id, body), {
    params: idParams,
    body: updateDebtBody
  })
  .delete(
    '/:id',
    async ({ workspaceId, params, set }) => {
      await debtService.deleteDebt(workspaceId, params.id);
      set.status = 204;
    },
    { params: idParams }
  )
  .post(
    '/:id/payments',
    async ({ workspaceId, userId, params, body, set }) => {
      set.status = 201;
      return debtPaymentService.recordPayment(workspaceId, params.id, { ...body, createdBy: userId });
    },
    { params: idParams, body: createDebtPaymentBody }
  )
  .delete(
    '/:id/payments/:paymentId',
    ({ workspaceId, params }) => debtPaymentService.deletePayment(workspaceId, params.id, params.paymentId),
    { params: debtPaymentParams }
  )
  .post('/:id/write-off', ({ workspaceId, params }) => debtPaymentService.writeOff(workspaceId, params.id), {
    params: idParams
  });
