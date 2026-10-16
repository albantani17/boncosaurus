import type {
  DebtPaymentProposalDraft,
  DebtProposalDraft,
  DebtWriteOffProposalDraft,
  TransactionProposalDraft
} from '@boncosaurus/shared';
import type { ProposalToolName, SavedRecord } from '../../domain/chat/proposal-parts';
import type { ActorContext } from '../ai-provider/ai-provider.service';
import type { DebtPaymentService } from '../debt/debt-payment.service';
import type { DebtService } from '../debt/debt.service';
import type { SplitExpenseService } from '../debt/split-expense.service';
import type { TransactionService } from '../transaction/transaction.service';

export type ProposalActionDependencies = {
  transactions: Pick<TransactionService, 'createTransaction'>;
  splitExpenses: Pick<SplitExpenseService, 'createSplitExpense'>;
  debts: Pick<DebtService, 'createDebt'>;
  debtPayments: Pick<DebtPaymentService, 'recordPayment' | 'writeOff'>;
};

/** Carries out a draft the user confirmed in the chat, through the same services the app uses. */
export function createProposalActions(deps: ProposalActionDependencies) {
  async function saveTransaction({ userId, workspaceId }: ActorContext, draft: TransactionProposalDraft) {
    const { splits, ...rest } = draft;
    const input = { ...rest, occurredAt: new Date(draft.occurredAt), source: 'ai' as const, createdBy: userId };
    const transaction = splits?.length
      ? await deps.splitExpenses.createSplitExpense(workspaceId, { ...input, splits })
      : await deps.transactions.createTransaction(workspaceId, input);
    return { transactionId: transaction.id };
  }

  async function saveDebt({ userId, workspaceId }: ActorContext, draft: DebtProposalDraft) {
    const debt = await deps.debts.createDebt(workspaceId, {
      ...draft,
      originatedAt: new Date(draft.originatedAt),
      createdBy: userId
    });
    return { debtId: debt.id };
  }

  async function savePayment({ userId, workspaceId }: ActorContext, draft: DebtPaymentProposalDraft) {
    const { debtId, accountId, amount, paidAt, extraCategoryId, note } = draft;
    await deps.debtPayments.recordPayment(workspaceId, debtId, {
      accountId,
      amount,
      paidAt: new Date(paidAt),
      extraCategoryId,
      note,
      createdBy: userId
    });
    return { debtId };
  }

  async function saveWriteOff({ workspaceId }: ActorContext, draft: DebtWriteOffProposalDraft) {
    await deps.debtPayments.writeOff(workspaceId, draft.debtId);
    return { debtId: draft.debtId };
  }

  return {
    save(actor: ActorContext, toolName: ProposalToolName, draft: unknown): Promise<SavedRecord> {
      switch (toolName) {
        case 'proposeTransaction':
          return saveTransaction(actor, draft as TransactionProposalDraft);
        case 'proposeDebt':
          return saveDebt(actor, draft as DebtProposalDraft);
        case 'proposeDebtPayment':
          return savePayment(actor, draft as DebtPaymentProposalDraft);
        case 'proposeDebtWriteOff':
          return saveWriteOff(actor, draft as DebtWriteOffProposalDraft);
      }
    }
  };
}

export type ProposalActions = ReturnType<typeof createProposalActions>;
