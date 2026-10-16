import type {
  DebtPaymentProposal,
  DebtProposal,
  DebtWriteOffProposal,
  TransactionProposal
} from '@boncosaurus/shared';

export const PROPOSAL_TOOL_NAMES = [
  'proposeTransaction',
  'proposeDebt',
  'proposeDebtPayment',
  'proposeDebtWriteOff'
] as const;

export type ProposalToolName = (typeof PROPOSAL_TOOL_NAMES)[number];
export type AnyProposal = TransactionProposal | DebtProposal | DebtPaymentProposal | DebtWriteOffProposal;
export type StoredProposal = { toolName: ProposalToolName; proposal: AnyProposal };
export type SavedRecord = { transactionId: string } | { debtId: string };

const TOOL_PREFIX = 'tool-';

type ProposalPart = { type: string; toolCallId: string; state: 'output-available'; output: AnyProposal };

const proposalToolOf = (type: unknown): ProposalToolName | null => {
  if (typeof type !== 'string' || !type.startsWith(TOOL_PREFIX)) return null;
  const name = type.slice(TOOL_PREFIX.length);
  return (PROPOSAL_TOOL_NAMES as readonly string[]).includes(name) ? (name as ProposalToolName) : null;
};

const isProposalPart = (part: unknown, toolCallId: string): part is ProposalPart => {
  if (typeof part !== 'object' || part === null) return false;
  const candidate = part as Partial<ProposalPart>;
  return (
    proposalToolOf(candidate.type) !== null &&
    candidate.toolCallId === toolCallId &&
    candidate.state === 'output-available' &&
    typeof candidate.output === 'object' &&
    candidate.output !== null
  );
};

export function findProposal(parts: unknown[], toolCallId: string): StoredProposal | null {
  const part = parts.find((candidate) => isProposalPart(candidate, toolCallId)) as ProposalPart | undefined;
  return part ? { toolName: proposalToolOf(part.type)!, proposal: part.output } : null;
}

export function replaceProposal(parts: unknown[], toolCallId: string, output: AnyProposal): unknown[] {
  return parts.map((part) => (isProposalPart(part, toolCallId) ? { ...part, output } : part));
}

/** The id a saved proposal points to: the transaction it created, or the debt it changed. */
export function savedRecordOf(proposal: AnyProposal & { status: 'saved' }): SavedRecord {
  return 'transactionId' in proposal ? { transactionId: proposal.transactionId } : { debtId: proposal.debtId };
}
