import { tool } from 'ai';
import { z } from 'zod';
import { AppError } from '../../errors/app-error';
import type { TransactionProposal, TransactionProposalDraft } from '../../types/ai.types';
import type { Category, Transaction, TransactionFilters } from '../../types/finance.types';
import type { PeriodSummary } from '../../types/report.types';
import { parseToolDate } from '../../utils/chat/parse-tool-date';
import type { AccountWithBalance } from '../account.service';
import type { CreateTransactionInput } from '../transaction.service';

export type ChatToolDependencies = {
  reports: { getSummary(workspaceId: string, range: { from: Date; to: Date }): Promise<PeriodSummary> };
  accounts: { listAccounts(workspaceId: string): Promise<AccountWithBalance[]> };
  categories: { listCategories(workspaceId: string): Promise<Category[]> };
  transactions: {
    listTransactions(workspaceId: string, filters: TransactionFilters): Promise<Transaction[]>;
    previewTransaction(workspaceId: string, input: CreateTransactionInput): Promise<void>;
  };
};

export const PROPOSE_TRANSACTION_TOOL = 'proposeTransaction';

const MAX_SEARCH_RESULTS = 50;
const DATE_HINT = 'ISO 8601 datetime with offset, e.g. 2026-10-01T00:00:00+07:00';

const transactionType = z.enum(['income', 'expense', 'transfer']);
const isoDate = z.string().describe(DATE_HINT);
const invalidDate = (field: string) => ({ error: `${field} must be an ${DATE_HINT}` });

const nameMap = <T extends { id: string; name: string }>(rows: T[]) =>
  new Map(rows.map((row) => [row.id, row.name]));

export function createChatTools(deps: ChatToolDependencies, workspaceId: string) {
  async function loadNames() {
    const [accounts, categories] = await Promise.all([
      deps.accounts.listAccounts(workspaceId),
      deps.categories.listCategories(workspaceId)
    ]);
    return { accounts: nameMap(accounts), categories: nameMap(categories) };
  }

  return {
    getSummary: tool({
      description:
        'Income and expense totals per currency plus totals per category for a date range (both ends inclusive). Transfers are excluded.',
      inputSchema: z.object({ from: isoDate, to: isoDate }),
      execute: async ({ from, to }) => {
        const range = { from: parseToolDate(from), to: parseToolDate(to) };
        if (!range.from) return invalidDate('from');
        if (!range.to) return invalidDate('to');

        const [summary, names] = await Promise.all([
          deps.reports.getSummary(workspaceId, { from: range.from, to: range.to }),
          loadNames()
        ]);
        return {
          totals: summary.totals,
          byCategory: summary.byCategory.map((row) => ({
            ...row,
            categoryName: row.categoryId ? (names.categories.get(row.categoryId) ?? null) : null
          }))
        };
      }
    }),

    listAccounts: tool({
      description: 'All accounts with their current balance and currency.',
      inputSchema: z.object({}),
      execute: async () =>
        (await deps.accounts.listAccounts(workspaceId)).map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: account.balance,
          isArchived: account.isArchived
        }))
    }),

    listCategories: tool({
      description: 'All income and expense categories.',
      inputSchema: z.object({}),
      execute: async () =>
        (await deps.categories.listCategories(workspaceId)).map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
          parentId: category.parentId,
          isArchived: category.isArchived
        }))
    }),

    searchTransactions: tool({
      description: `Transactions, newest first, optionally filtered. Returns at most ${MAX_SEARCH_RESULTS} rows.`,
      inputSchema: z.object({
        from: isoDate.optional(),
        to: isoDate.optional(),
        type: transactionType.optional(),
        accountId: z.string().optional(),
        categoryId: z.string().optional(),
        limit: z.number().int().min(1).max(MAX_SEARCH_RESULTS).optional()
      }),
      execute: async ({ from, to, type, accountId, categoryId, limit }) => {
        const fromDate = from === undefined ? undefined : parseToolDate(from);
        const toDate = to === undefined ? undefined : parseToolDate(to);
        if (fromDate === null) return invalidDate('from');
        if (toDate === null) return invalidDate('to');

        const [rows, names] = await Promise.all([
          deps.transactions.listTransactions(workspaceId, {
            from: fromDate,
            to: toDate,
            type,
            accountId,
            categoryId,
            limit: limit ?? 20,
            offset: 0
          }),
          loadNames()
        ]);
        return rows.map((row) => ({
          id: row.id,
          type: row.type,
          amount: row.amount,
          toAmount: row.toAmount,
          fee: row.fee,
          occurredAt: row.occurredAt.toISOString(),
          account: names.accounts.get(row.accountId) ?? null,
          toAccount: row.toAccountId ? (names.accounts.get(row.toAccountId) ?? null) : null,
          category: row.categoryId ? (names.categories.get(row.categoryId) ?? null) : null,
          note: row.note
        }));
      }
    }),

    [PROPOSE_TRANSACTION_TOOL]: tool({
      description:
        'Prepare a new transaction for the user to confirm. Nothing is saved until the user confirms it in the app. ' +
        'Use account and category ids from the context. Transfers need toAccountId and no category; ' +
        'toAmount is only for transfers between accounts with different currencies. fee is an optional admin fee for transfers.',
      inputSchema: z.object({
        type: transactionType,
        accountId: z.string(),
        toAccountId: z.string().nullish(),
        categoryId: z.string().nullish(),
        amount: z.number().int().positive().describe('Whole units of the account currency, no decimals'),
        toAmount: z.number().int().positive().nullish(),
        fee: z.number().int().positive().nullish().describe('Transfer admin fee in the source account currency; transfers only'),
        occurredAt: isoDate,
        note: z.string().max(500).nullish()
      }),
      execute: async (input): Promise<TransactionProposal> => {
        const occurredAt = parseToolDate(input.occurredAt);
        if (!occurredAt) return { status: 'invalid', code: 'INVALID_DATE', message: invalidDate('occurredAt').error };

        const draft: TransactionProposalDraft = {
          type: input.type,
          accountId: input.accountId,
          toAccountId: input.toAccountId ?? null,
          categoryId: input.categoryId ?? null,
          amount: input.amount,
          toAmount: input.toAmount ?? null,
          fee: input.fee ?? null,
          occurredAt: occurredAt.toISOString(),
          note: input.note?.trim() || null
        };
        try {
          await deps.transactions.previewTransaction(workspaceId, { ...draft, occurredAt });
        } catch (error) {
          if (error instanceof AppError) return { status: 'invalid', code: error.code, message: error.message };
          throw error;
        }
        return { status: 'pending', draft };
      }
    })
  };
}

export type ChatTools = ReturnType<typeof createChatTools>;
