import { AppError } from '../../errors/app-error';

export type InvalidProposal = { status: 'invalid'; code: string; message: string };

/** Hands a rejected draft back to the model so it can fix the input; unexpected errors still throw. */
export function toInvalidProposal(error: unknown): InvalidProposal {
  if (error instanceof AppError) return { status: 'invalid', code: error.code, message: error.message };
  throw error;
}
