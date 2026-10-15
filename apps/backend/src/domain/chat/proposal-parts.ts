import type { TransactionProposal } from '../../types/ai.types';

const PROPOSAL_PART_TYPE = 'tool-proposeTransaction';

type ProposalPart = {
  type: typeof PROPOSAL_PART_TYPE;
  toolCallId: string;
  state: 'output-available';
  output: TransactionProposal;
};

const isProposalPart = (part: unknown, toolCallId: string): part is ProposalPart => {
  if (typeof part !== 'object' || part === null) return false;
  const candidate = part as Partial<ProposalPart>;
  return (
    candidate.type === PROPOSAL_PART_TYPE &&
    candidate.toolCallId === toolCallId &&
    candidate.state === 'output-available' &&
    typeof candidate.output === 'object' &&
    candidate.output !== null
  );
};

export function findProposal(parts: unknown[], toolCallId: string): TransactionProposal | null {
  const part = parts.find((candidate) => isProposalPart(candidate, toolCallId));
  return part ? (part as ProposalPart).output : null;
}

export function replaceProposal(parts: unknown[], toolCallId: string, output: TransactionProposal): unknown[] {
  return parts.map((part) => (isProposalPart(part, toolCallId) ? { ...part, output } : part));
}
