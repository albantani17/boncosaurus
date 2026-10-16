import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { currencyCode, money, timestamps, uuidV7Pk } from './columns';
import { counterparties } from './counterparties';
import { debtDirection, debtOrigin, debtSourceType, debtStatus } from './enums';
import { transactions } from './transactions';
import { users } from './users';
import { workspaces } from './workspaces';

export const debts = pgTable(
  'debts',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    direction: debtDirection('direction').notNull(),
    sourceType: debtSourceType('source_type').notNull(),
    origin: debtOrigin('origin').notNull(),
    counterpartyId: uuid('counterparty_id').notNull(),
    title: text('title').notNull(),
    currency: currencyCode('currency').notNull(),
    principal: money('principal').notNull(),
    originatedAt: timestamp('originated_at', { withTimezone: true }).notNull(),
    dueDate: date('due_date', { mode: 'string' }),
    reminderDays: integer('reminder_days').notNull().default(0),
    status: debtStatus('status').notNull().default('active'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    writtenOffAmount: money('written_off_amount'),
    note: text('note'),
    categoryId: uuid('category_id'),
    disbursementTransactionId: uuid('disbursement_transaction_id'),
    originTransactionId: uuid('origin_transaction_id'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps()
  },
  (table): PgTableExtraConfigValue[] => [
    unique('debts_workspace_id_unique').on(table.workspaceId, table.id),
    foreignKey({
      name: 'debts_counterparty_fk',
      columns: [table.workspaceId, table.counterpartyId],
      foreignColumns: [counterparties.workspaceId, counterparties.id]
    }),
    foreignKey({
      name: 'debts_category_fk',
      columns: [table.workspaceId, table.categoryId],
      foreignColumns: [categories.workspaceId, categories.id]
    }),
    foreignKey({
      name: 'debts_disbursement_transaction_fk',
      columns: [table.workspaceId, table.disbursementTransactionId],
      foreignColumns: [transactions.workspaceId, transactions.id]
    }),
    foreignKey({
      name: 'debts_origin_transaction_fk',
      columns: [table.workspaceId, table.originTransactionId],
      foreignColumns: [transactions.workspaceId, transactions.id]
    }),
    check('debts_principal_positive', sql`${table.principal} > 0`),
    check('debts_reminder_days_range', sql`${table.reminderDays} BETWEEN 0 AND 60`),
    check(
      'debts_written_off_amount_positive',
      sql`${table.writtenOffAmount} IS NULL OR ${table.writtenOffAmount} > 0`
    ),
    check(
      'debts_cash_shape',
      sql`${table.origin} <> 'cash' OR (${table.disbursementTransactionId} IS NOT NULL AND ${table.originTransactionId} IS NULL AND ${table.categoryId} IS NULL)`
    ),
    check(
      'debts_split_shape',
      sql`${table.origin} <> 'split' OR (${table.direction} = 'receivable' AND ${table.originTransactionId} IS NOT NULL AND ${table.disbursementTransactionId} IS NULL AND ${table.categoryId} IS NULL)`
    ),
    check(
      'debts_purchase_shape',
      sql`${table.origin} <> 'purchase' OR (${table.direction} = 'payable' AND ${table.categoryId} IS NOT NULL AND ${table.disbursementTransactionId} IS NULL AND ${table.originTransactionId} IS NULL)`
    ),
    index('debts_workspace_status_idx').on(table.workspaceId, table.status),
    index('debts_counterparty_idx').on(table.counterpartyId),
    index('debts_origin_transaction_idx').on(table.originTransactionId)
  ]
);
