import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  type PgTableExtraConfigValue,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { categories } from './categories';
import { money, timestamps, uuidV7Pk } from './columns';
import { debts } from './debts';
import { debtTransactionRole, transactionSource, transactionType } from './enums';
import { users } from './users';
import { workspaces } from './workspaces';

export const transactions = pgTable(
  'transactions',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    type: transactionType('type').notNull(),
    accountId: uuid('account_id').notNull(),
    toAccountId: uuid('to_account_id'),
    categoryId: uuid('category_id'),
    amount: money('amount').notNull(),
    toAmount: money('to_amount'),
    fee: money('fee'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    note: text('note'),
    source: transactionSource('source').notNull().default('manual'),
    debtId: uuid('debt_id'),
    debtRole: debtTransactionRole('debt_role'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps()
  },
  (table): PgTableExtraConfigValue[] => [
    unique('transactions_workspace_id_unique').on(table.workspaceId, table.id),
    foreignKey({
      name: 'transactions_account_fk',
      columns: [table.workspaceId, table.accountId],
      foreignColumns: [accounts.workspaceId, accounts.id]
    }),
    foreignKey({
      name: 'transactions_to_account_fk',
      columns: [table.workspaceId, table.toAccountId],
      foreignColumns: [accounts.workspaceId, accounts.id]
    }),
    foreignKey({
      name: 'transactions_category_fk',
      columns: [table.workspaceId, table.categoryId],
      foreignColumns: [categories.workspaceId, categories.id]
    }),
    foreignKey({
      name: 'transactions_debt_fk',
      columns: [table.workspaceId, table.debtId],
      foreignColumns: [debts.workspaceId, debts.id]
    }),
    check('transactions_debt_link', sql`(${table.debtId} IS NULL) = (${table.debtRole} IS NULL)`),
    check(
      'transactions_debt_principal_shape',
      sql`${table.debtRole} IS DISTINCT FROM 'principal' OR (${table.type} <> 'transfer' AND ${table.categoryId} IS NULL)`
    ),
    check('transactions_amount_positive', sql`${table.amount} > 0`),
    check(
      'transactions_to_amount_positive',
      sql`${table.toAmount} IS NULL OR ${table.toAmount} > 0`
    ),
    check('transactions_fee_positive', sql`${table.fee} IS NULL OR ${table.fee} > 0`),
    check('transactions_fee_transfer_only', sql`${table.type} = 'transfer' OR ${table.fee} IS NULL`),
    check(
      'transactions_transfer_shape',
      sql`${table.type} <> 'transfer' OR (${table.toAccountId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.toAccountId} <> ${table.accountId})`
    ),
    check(
      'transactions_non_transfer_shape',
      sql`${table.type} = 'transfer' OR (${table.toAccountId} IS NULL AND ${table.toAmount} IS NULL)`
    ),
    index('transactions_workspace_occurred_idx').on(table.workspaceId, table.occurredAt.desc()),
    index('transactions_account_idx').on(table.accountId),
    index('transactions_category_idx').on(table.categoryId),
    index('transactions_debt_idx').on(table.debtId)
  ]
);
