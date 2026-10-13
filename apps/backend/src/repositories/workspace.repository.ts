import { asc, and, eq } from 'drizzle-orm';
import { db } from '../db';
import { workspaceMembers, workspaces } from '../db/schema';
import type { WorkspaceMembership } from '../types/auth.types';

export type WorkspaceRepository = {
  isMember(userId: string, workspaceId: string): Promise<boolean>;
  findFirstWorkspaceIdForUser(userId: string): Promise<string | undefined>;
  listForUser(userId: string): Promise<WorkspaceMembership[]>;
};

const membershipsOf = (userId: string) =>
  db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      baseCurrency: workspaces.baseCurrency,
      role: workspaceMembers.role
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt), asc(workspaces.id));

export const workspaceRepository: WorkspaceRepository = {
  async isMember(userId, workspaceId) {
    const [row] = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)));
    return row !== undefined;
  },

  async findFirstWorkspaceIdForUser(userId) {
    const [row] = await membershipsOf(userId).limit(1);
    return row?.id;
  },

  listForUser: (userId) => membershipsOf(userId)
};
