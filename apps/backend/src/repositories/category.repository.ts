import { and, asc, count, eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, transactions } from '../db/schema';
import type { Category, CategoryPatch, NewCategory } from '../types/finance.types';

export type CategoryRepository = {
  list(workspaceId: string): Promise<Category[]>;
  findById(workspaceId: string, id: string): Promise<Category | undefined>;
  insert(values: NewCategory): Promise<Category>;
  update(workspaceId: string, id: string, patch: CategoryPatch): Promise<Category | undefined>;
  delete(workspaceId: string, id: string): Promise<void>;
  countChildren(workspaceId: string, id: string): Promise<number>;
  countTransactions(workspaceId: string, id: string): Promise<number>;
};

const inWorkspace = (workspaceId: string, id: string) =>
  and(eq(categories.workspaceId, workspaceId), eq(categories.id, id));

export const categoryRepository: CategoryRepository = {
  list: (workspaceId) =>
    db
      .select()
      .from(categories)
      .where(eq(categories.workspaceId, workspaceId))
      .orderBy(asc(categories.type), asc(categories.name)),

  async findById(workspaceId, id) {
    const [row] = await db.select().from(categories).where(inWorkspace(workspaceId, id));
    return row;
  },

  async insert(values) {
    const [row] = await db.insert(categories).values(values).returning();
    return row!;
  },

  async update(workspaceId, id, patch) {
    const [row] = await db
      .update(categories)
      .set(patch)
      .where(inWorkspace(workspaceId, id))
      .returning();
    return row;
  },

  async delete(workspaceId, id) {
    await db.delete(categories).where(inWorkspace(workspaceId, id));
  },

  async countChildren(workspaceId, id) {
    const [row] = await db
      .select({ total: count() })
      .from(categories)
      .where(and(eq(categories.workspaceId, workspaceId), eq(categories.parentId, id)));
    return row?.total ?? 0;
  },

  async countTransactions(workspaceId, id) {
    const [row] = await db
      .select({ total: count() })
      .from(transactions)
      .where(and(eq(transactions.workspaceId, workspaceId), eq(transactions.categoryId, id)));
    return row?.total ?? 0;
  }
};
