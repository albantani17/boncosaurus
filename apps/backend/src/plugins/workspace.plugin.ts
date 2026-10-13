import { Elysia } from 'elysia';
import { workspaceService } from '../container';
import { authenticateRequest } from './authenticate-request';

// Provides userId (from the access token) and workspaceId (membership-checked) to routes.
export const workspacePlugin = new Elysia({ name: 'workspace' }).resolve(
  { as: 'scoped' },
  async ({ headers }) => {
    const userId = await authenticateRequest(headers.authorization);
    const workspaceId = await workspaceService.resolveWorkspaceId(userId, headers['x-workspace-id']);
    return { userId, workspaceId };
  }
);
