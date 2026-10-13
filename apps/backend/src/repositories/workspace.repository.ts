import { asc } from 'drizzle-orm';
import { db } from '../db';
import { workspaces } from '../db/schema';

export type WorkspaceRepository = {
  findFirstWorkspaceId(): Promise<string | undefined>;
};

export const workspaceRepository: WorkspaceRepository = {
  async findFirstWorkspaceId() {
    const [row] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .orderBy(asc(workspaces.createdAt), asc(workspaces.id))
      .limit(1);
    return row?.id;
  }
};
