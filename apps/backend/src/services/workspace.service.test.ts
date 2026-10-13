import { describe, expect, test } from 'bun:test';
import type { WorkspaceRepository } from '../repositories/workspace.repository';
import { createWorkspaceService } from './workspace.service';

const createFakeRepository = (workspaceId: string | undefined) => {
  let calls = 0;
  const repository: WorkspaceRepository = {
    findFirstWorkspaceId: async () => {
      calls += 1;
      return workspaceId;
    }
  };
  return { repository, getCalls: () => calls };
};

describe('getDefaultWorkspaceId', () => {
  test('returns the first workspace id', async () => {
    const { repository } = createFakeRepository('ws-1');

    expect(await createWorkspaceService(repository).getDefaultWorkspaceId()).toBe('ws-1');
  });

  test('caches the id after the first lookup', async () => {
    const { repository, getCalls } = createFakeRepository('ws-1');
    const service = createWorkspaceService(repository);

    await service.getDefaultWorkspaceId();
    await service.getDefaultWorkspaceId();

    expect(getCalls()).toBe(1);
  });

  test('throws NOT_INITIALIZED when no workspace exists', async () => {
    const { repository } = createFakeRepository(undefined);

    await expect(createWorkspaceService(repository).getDefaultWorkspaceId()).rejects.toMatchObject({
      status: 409,
      code: 'NOT_INITIALIZED'
    });
  });

  test('does not cache a missing workspace', async () => {
    const { repository, getCalls } = createFakeRepository(undefined);
    const service = createWorkspaceService(repository);

    await service.getDefaultWorkspaceId().catch(() => undefined);
    await service.getDefaultWorkspaceId().catch(() => undefined);

    expect(getCalls()).toBe(2);
  });
});
