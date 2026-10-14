import { and, asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { aiProviders } from '../db/schema';
import type { AiProviderPatch, AiProviderRecord, NewAiProvider } from '../types/ai.types';

export type AiProviderRepository = {
  list(workspaceId: string): Promise<AiProviderRecord[]>;
  findById(workspaceId: string, id: string): Promise<AiProviderRecord | undefined>;
  findDefault(workspaceId: string): Promise<AiProviderRecord | undefined>;
  insert(values: NewAiProvider): Promise<AiProviderRecord>;
  update(workspaceId: string, id: string, patch: AiProviderPatch): Promise<AiProviderRecord | undefined>;
  delete(workspaceId: string, id: string): Promise<void>;
  setDefault(workspaceId: string, id: string): Promise<void>;
};

const inWorkspace = (workspaceId: string, id: string) =>
  and(eq(aiProviders.workspaceId, workspaceId), eq(aiProviders.id, id));

export const aiProviderRepository: AiProviderRepository = {
  list: (workspaceId) =>
    db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.workspaceId, workspaceId))
      .orderBy(asc(aiProviders.createdAt), asc(aiProviders.id)),

  async findById(workspaceId, id) {
    const [row] = await db.select().from(aiProviders).where(inWorkspace(workspaceId, id));
    return row;
  },

  async findDefault(workspaceId) {
    const [row] = await db
      .select()
      .from(aiProviders)
      .where(and(eq(aiProviders.workspaceId, workspaceId), eq(aiProviders.isDefault, true)));
    return row;
  },

  async insert(values) {
    const [row] = await db.insert(aiProviders).values(values).returning();
    return row!;
  },

  async update(workspaceId, id, patch) {
    const [row] = await db
      .update(aiProviders)
      .set(patch)
      .where(inWorkspace(workspaceId, id))
      .returning();
    return row;
  },

  async delete(workspaceId, id) {
    await db.delete(aiProviders).where(inWorkspace(workspaceId, id));
  },

  async setDefault(workspaceId, id) {
    await db.transaction(async (tx) => {
      await tx
        .update(aiProviders)
        .set({ isDefault: false })
        .where(and(eq(aiProviders.workspaceId, workspaceId), eq(aiProviders.isDefault, true)));
      await tx.update(aiProviders).set({ isDefault: true }).where(inWorkspace(workspaceId, id));
    });
  }
};
