import { bigint, char, timestamp, uuid } from 'drizzle-orm/pg-core';

export const uuidV7Pk = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7());

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

export const timestamps = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt()
});

export const money = (name: string) => bigint(name, { mode: 'number' });

export const currencyCode = (name: string) => char(name, { length: 3 });
