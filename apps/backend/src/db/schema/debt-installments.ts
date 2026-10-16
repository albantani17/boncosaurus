import { sql } from 'drizzle-orm';
import { check, date, foreignKey, integer, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { money, timestamps, uuidV7Pk } from './columns';
import { debts } from './debts';
import { workspaces } from './workspaces';

export const debtInstallments = pgTable(
  'debt_installments',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    debtId: uuid('debt_id').notNull(),
    sequence: integer('sequence').notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    amount: money('amount').notNull(),
    ...timestamps()
  },
  (table) => [
    foreignKey({
      name: 'debt_installments_debt_fk',
      columns: [table.workspaceId, table.debtId],
      foreignColumns: [debts.workspaceId, debts.id]
    }).onDelete('cascade'),
    unique('debt_installments_debt_sequence_unique').on(table.debtId, table.sequence),
    check('debt_installments_amount_positive', sql`${table.amount} > 0`)
  ]
);
