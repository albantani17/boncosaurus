import { ConflictError } from '../errors/app-error';
import type { WorkspaceRepository } from '../repositories/workspace.repository';

export function createWorkspaceService(repository: WorkspaceRepository) {
  let cachedWorkspaceId: string | undefined;

  return {
    async getDefaultWorkspaceId(): Promise<string> {
      if (cachedWorkspaceId) return cachedWorkspaceId;

      const workspaceId = await repository.findFirstWorkspaceId();
      if (!workspaceId) {
        throw new ConflictError(
          'NOT_INITIALIZED',
          'No workspace exists yet. Set ADMIN_EMAIL and restart to run first-run setup.'
        );
      }
      cachedWorkspaceId = workspaceId;
      return workspaceId;
    }
  };
}
