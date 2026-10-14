import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { ProfilePatch, UserRecord } from '../types/auth.types';

export type UserRepository = {
  findByEmail(email: string): Promise<UserRecord | undefined>;
  findById(id: string): Promise<UserRecord | undefined>;
  updateProfile(id: string, patch: ProfilePatch): Promise<UserRecord | undefined>;
  setPasswordHash(id: string, passwordHash: string): Promise<void>;
};

export const userRepository: UserRepository = {
  async findByEmail(email) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  },

  async findById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  },

  async updateProfile(id, patch) {
    const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    return row;
  },

  async setPasswordHash(id, passwordHash) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }
};
