import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { UserRecord } from '../types/auth.types';

export type UserRepository = {
  findByEmail(email: string): Promise<UserRecord | undefined>;
  findById(id: string): Promise<UserRecord | undefined>;
};

export const userRepository: UserRepository = {
  async findByEmail(email) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  },

  async findById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }
};
