import { pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, uuidV7Pk } from './columns';

export const users = pgTable('users', {
  id: uuidV7Pk(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: createdAt()
});
