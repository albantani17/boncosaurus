import { pgTable, text } from 'drizzle-orm/pg-core';
import { currencyCode, timestamps, uuidV7Pk } from './columns';

export const workspaces = pgTable('workspaces', {
  id: uuidV7Pk(),
  name: text('name').notNull(),
  baseCurrency: currencyCode('base_currency').notNull().default('IDR'),
  ...timestamps()
});
