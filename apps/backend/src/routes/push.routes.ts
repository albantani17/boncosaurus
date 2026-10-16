import { Elysia } from 'elysia';
import { pushService } from '../container';
import { workspacePlugin } from '../plugins/workspace.plugin';
import { pushSubscriptionBody, pushUnsubscribeBody } from '../schemas/push.schema';

export const pushRoutes = new Elysia({ prefix: '/push' })
  .use(workspacePlugin)
  .get('/config', () => pushService.getConfig())
  .post(
    '/subscriptions',
    async ({ userId, workspaceId, body, set }) => {
      await pushService.subscribe({ userId, workspaceId }, body);
      set.status = 204;
    },
    { body: pushSubscriptionBody }
  )
  .delete(
    '/subscriptions',
    async ({ userId, workspaceId, body, set }) => {
      await pushService.unsubscribe({ userId, workspaceId }, body.endpoint);
      set.status = 204;
    },
    { body: pushUnsubscribeBody }
  )
  .post('/test', ({ userId, workspaceId }) => pushService.sendTest({ userId, workspaceId }));
