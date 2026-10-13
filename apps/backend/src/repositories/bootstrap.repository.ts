import { count } from 'drizzle-orm';
import { db } from '../db';
import { categories, users, workspaceMembers, workspaces } from '../db/schema';
import type { BootstrapRepository } from '../types/bootstrap.types';
import { buildCategoryRows } from '../utils/build-category-rows';

export const bootstrapRepository: BootstrapRepository = {
  async countUsers() {
    const [row] = await db.select({ total: count() }).from(users);
    return row?.total ?? 0;
  },

  async createInitialWorkspace(config, defaults) {
    await db.transaction(async (tx) => {
      const [admin] = await tx
        .insert(users)
        .values({ email: config.adminEmail, name: config.adminName })
        .returning({ id: users.id });
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: config.workspaceName, baseCurrency: config.baseCurrency })
        .returning({ id: workspaces.id });

      await tx
        .insert(workspaceMembers)
        .values({ workspaceId: workspace!.id, userId: admin!.id, role: 'owner' });
      await tx.insert(categories).values(buildCategoryRows(workspace!.id, defaults));
    });
  }
};
