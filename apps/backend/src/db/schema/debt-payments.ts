import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { money, timestamps, uuidV7Pk } from './columns';
import { debts } from './debts';
import { transactions } from './transactions';
import { workspaces } from './workspaces';

export const debtPayments = pgTable(
  'debt_payments',
  {
    id: uuidV7Pk(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    debtId: uuid('debt_id').notNull(),
    accountId: uuid('account_id').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
    amount: money('amount').notNull(),
    principalAmount: money('principal_amount').notNull(),
    extraAmount: money('extra_amount').notNull(),
    repaymentTransactionId: uuid('repayment_transaction_id'),
    chargeTransactionId: uuid('charge_transaction_id'),
    note: text('note'),
    ...timestamps()
  },
  (table) => [
    foreignKey({
      name: 'debt_payments_debt_fk',
      columns: [table.workspaceId, table.debtId],
      foreignColumns: [debts.workspaceId, debts.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'debt_payments_account_fk',
      columns: [table.workspaceId, table.accountId],
      foreignColumns: [accounts.workspaceId, accounts.id]
    }),
    foreignKey({
      name: 'debt_payments_repayment_transaction_fk',
      columns: [table.workspaceId, table.repaymentTransactionId],
      foreignColumns: [transactions.workspaceId, transactions.id]
    }),
    foreignKey({
      name: 'debt_payments_charge_transaction_fk',
      columns: [table.workspaceId, table.chargeTransactionId],
      foreignColumns: [transactions.workspaceId, transactions.id]
    }),
    check(
      'debt_payments_amounts',
      sql`${table.amount} > 0 AND ${table.principalAmount} >= 0 AND ${table.extraAmount} >= 0 AND ${table.amount} = ${table.principalAmount} + ${table.extraAmount}`
    ),
    check(
      'debt_payments_transactions',
      sql`(${table.principalAmount} = 0) = (${table.repaymentTransactionId} IS NULL) AND (${table.extraAmount} = 0) = (${table.chargeTransactionId} IS NULL)`
    ),
    index('debt_payments_debt_idx').on(table.debtId)
  ]
);
