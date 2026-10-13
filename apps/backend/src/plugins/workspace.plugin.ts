import { Elysia } from 'elysia';
import { workspaceService } from '../container';

// Self-host has no auth yet: every request runs in the default workspace.
// Replace this derive with the session's workspace when auth lands.
export const workspacePlugin = new Elysia({ name: 'workspace' }).derive(
  { as: 'scoped' },
  async () => ({ workspaceId: await workspaceService.getDefaultWorkspaceId() })
);
