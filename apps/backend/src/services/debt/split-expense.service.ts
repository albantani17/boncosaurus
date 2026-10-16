import type { TransactionSplitBody } from '@boncosaurus/shared';
import { BadRequestError, NotFoundError } from '../../errors/app-error';
import type { AccountRepository } from '../../repositories/account.repository';
import type { DebtRepository, SplitExpenseCreation } from '../../repositories/debt.repository';
import type { TransactionRepository } from '../../repositories/transaction.repository';
import type { NewCounterparty, NewDebt } from '../../types/debt.types';
import type { Transaction } from '../../types/finance.types';
import { validateDebtOrigin } from '../../domain/debt/validate-debt-origin';
import type { CounterpartyService, ResolvedCounterparty } from '../counterparty/counterparty.service';
import type { CreateTransactionInput, TransactionService } from '../transaction/transaction.service';

export type SplitExpenseInput = CreateTransactionInput & { splits: TransactionSplitBody[] };

type Dependencies = {
  debts: Pick<DebtRepository, 'createSplitExpense'>;
  transactions: Pick<TransactionRepository, 'findById'>;
  transactionService: Pick<TransactionService, 'previewTransaction'>;
  counterparties: Pick<CounterpartyService, 'resolveCounterparty'>;
  accounts: Pick<AccountRepository, 'findById'>;
  generateId: () => string;
};

const DEFAULT_SPLIT_TITLE = 'Patungan';

/** Records an expense I paid in full together with the shares other people owe me back. */
export function createSplitExpenseService(deps: Dependencies) {
  const { debts, transactions, transactionService, counterparties, accounts, generateId } = deps;

  // Two splits naming the same new person must create that person once.
  async function resolveAll(workspaceId: string, splits: TransactionSplitBody[]) {
    const createdByName = new Map<string, NewCounterparty & { id: string }>();
    const resolved: ResolvedCounterparty[] = [];
    for (const split of splits) {
      const pending = split.counterpartyName && createdByName.get(split.counterpartyName.trim().toLowerCase());
      if (!split.counterpartyId && pending) {
        resolved.push({ id: pending.id });
        continue;
      }
      const counterparty = await counterparties.resolveCounterparty(workspaceId, split, 'person');
      if (counterparty.created) createdByName.set(counterparty.created.name.toLowerCase(), counterparty.created);
      resolved.push(counterparty);
    }
    return { resolved, created: [...createdByName.values()] };
  }

  async function planSplitExpense(workspaceId: string, input: SplitExpenseInput): Promise<SplitExpenseCreation> {
    const { splits, ...transactionInput } = input;
    if (transactionInput.type !== 'expense') {
      throw new BadRequestError('INVALID_DEBT_ORIGIN', 'Only an expense can be split with others');
    }
    await transactionService.previewTransaction(workspaceId, transactionInput);
    const account = await accounts.findById(workspaceId, transactionInput.accountId);
    if (!account) throw new NotFoundError('Account');

    const transaction = { ...transactionInput, id: generateId(), workspaceId, debtId: null, debtRole: null } as Transaction;
    let splitTotal = 0;
    for (const split of splits) {
      validateDebtOrigin(
        { direction: 'receivable', origin: 'split', principal: split.amount, originTransactionId: transaction.id },
        { originTransaction: { transaction, account, splitTotal } }
      );
      splitTotal += split.amount;
    }

    const { resolved, created } = await resolveAll(workspaceId, splits);
    const title = transactionInput.note?.trim() || DEFAULT_SPLIT_TITLE;
    const newDebts = splits.map(
      (split, index): NewDebt => ({
        id: generateId(),
        workspaceId,
        direction: 'receivable',
        sourceType: 'personal',
        origin: 'split',
        counterpartyId: resolved[index]!.id,
        title: split.title?.trim() || title,
        currency: account.currency,
        principal: split.amount,
        originatedAt: transactionInput.occurredAt,
        dueDate: split.dueDate ?? null,
        originTransactionId: transaction.id,
        createdBy: transactionInput.createdBy
      })
    );

    return {
      transaction: { ...transactionInput, id: transaction.id, workspaceId },
      counterparties: created,
      debts: newDebts
    };
  }

  return {
    /** Validates the expense and its shares like createSplitExpense, without saving them. */
    async previewSplitExpense(workspaceId: string, input: SplitExpenseInput): Promise<void> {
      await planSplitExpense(workspaceId, input);
    },

    async createSplitExpense(workspaceId: string, input: SplitExpenseInput): Promise<Transaction> {
      const creation = await planSplitExpense(workspaceId, input);
      await debts.createSplitExpense(creation);
      return (await transactions.findById(workspaceId, creation.transaction.id!))!;
    }
  };
}

export type SplitExpenseService = ReturnType<typeof createSplitExpenseService>;
