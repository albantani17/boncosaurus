import { BadRequestError, ForbiddenError } from '../errors/app-error';
import type { WorkspaceRepository } from '../repositories/workspace.repository';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createWorkspaceService(repository: Pick<WorkspaceRepository, 'isMember' | 'findFirstWorkspaceIdForUser'>) {
  return {
    async resolveWorkspaceId(userId: string, requestedWorkspaceId?: string): Promise<string> {
      if (requestedWorkspaceId) {
        if (!UUID_PATTERN.test(requestedWorkspaceId)) {
          throw new BadRequestError('INVALID_WORKSPACE_ID', 'X-Workspace-Id must be a UUID');
        }
        if (!(await repository.isMember(userId, requestedWorkspaceId))) {
          throw new ForbiddenError('NOT_A_MEMBER', 'You are not a member of this workspace');
        }
        return requestedWorkspaceId;
      }

      const firstWorkspaceId = await repository.findFirstWorkspaceIdForUser(userId);
      if (!firstWorkspaceId) {
        throw new ForbiddenError('NO_WORKSPACE', 'This user does not belong to any workspace');
      }
      return firstWorkspaceId;
    }
  };
}
