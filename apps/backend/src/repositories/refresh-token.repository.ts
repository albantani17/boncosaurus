import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { refreshTokens } from '../db/schema';
import type { NewRefreshToken, RefreshTokenRecord } from '../types/auth.types';

export type RefreshTokenRepository = {
  insert(values: NewRefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | undefined>;
  // Revokes `currentId` and stores `next` atomically; false if `currentId` was already revoked.
  rotate(currentId: string, next: NewRefreshToken): Promise<boolean>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
};

export const refreshTokenRepository: RefreshTokenRepository = {
  async insert(values) {
    await db.insert(refreshTokens).values(values);
  },

  async findByHash(tokenHash) {
    const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    return row;
  },

  rotate: (currentId, next) =>
    db.transaction(async (tx) => {
      const revoked = await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.id, currentId), isNull(refreshTokens.revokedAt)))
        .returning({ id: refreshTokens.id });
      if (revoked.length === 0) return false;

      await tx.insert(refreshTokens).values(next);
      return true;
    }),

  async revokeFamily(familyId) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
  },

  async revokeAllForUser(userId) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }
};
