import type { CounterpartyKind, CounterpartyRef } from '@boncosaurus/shared';
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/app-error';
import type { CounterpartyRepository } from '../../repositories/counterparty.repository';
import type { Counterparty, CounterpartyPatch, NewCounterparty } from '../../types/debt.types';
import { isUniqueViolation } from '../../utils/is-unique-violation';

export type CreateCounterpartyInput = Pick<NewCounterparty, 'name' | 'kind'> & Partial<Pick<NewCounterparty, 'note'>>;

/** An existing counterparty, or a new one that the caller inserts with its own write. */
export type ResolvedCounterparty = { id: string; created?: NewCounterparty & { id: string } };

type Dependencies = {
  repository: CounterpartyRepository;
  generateId: () => string;
};

export const COUNTERPARTY_NAME_TAKEN_MESSAGE = 'A person or provider with this name already exists';

export function createCounterpartyService({ repository, generateId }: Dependencies) {
  async function requireCounterparty(workspaceId: string, id: string) {
    const counterparty = await repository.findById(workspaceId, id);
    if (!counterparty) throw new NotFoundError('Counterparty');
    return counterparty;
  }

  async function runUniqueNameWrite<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError('COUNTERPARTY_NAME_TAKEN', COUNTERPARTY_NAME_TAKEN_MESSAGE);
      throw error;
    }
  }

  return {
    listCounterparties: (workspaceId: string) => repository.list(workspaceId),

    async createCounterparty(workspaceId: string, input: CreateCounterpartyInput): Promise<Counterparty> {
      return runUniqueNameWrite(() => repository.insert({ ...input, name: input.name.trim(), workspaceId }));
    },

    async updateCounterparty(workspaceId: string, id: string, patch: CounterpartyPatch): Promise<Counterparty> {
      await requireCounterparty(workspaceId, id);
      const trimmed = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
      const updated = await runUniqueNameWrite(() => repository.update(workspaceId, id, trimmed));
      if (!updated) throw new NotFoundError('Counterparty');
      return updated;
    },

    async deleteCounterparty(workspaceId: string, id: string): Promise<void> {
      await requireCounterparty(workspaceId, id);
      if ((await repository.countDebts(workspaceId, id)) > 0) {
        throw new ConflictError('COUNTERPARTY_IN_USE', 'This person or provider has debts; archive it instead');
      }
      await repository.delete(workspaceId, id);
    },

    /** Picks the counterparty by id, else by name (case-insensitive), else plans a new one. */
    async resolveCounterparty(
      workspaceId: string,
      ref: CounterpartyRef,
      fallbackKind: CounterpartyKind
    ): Promise<ResolvedCounterparty> {
      if (ref.counterpartyId) return { id: (await requireCounterparty(workspaceId, ref.counterpartyId)).id };

      const name = ref.counterpartyName?.trim();
      if (!name) throw new BadRequestError('COUNTERPARTY_REQUIRED', 'Choose a person or provider, or type a new name');

      const existing = await repository.findByName(workspaceId, name);
      if (existing) return { id: existing.id };

      const id = generateId();
      return { id, created: { id, workspaceId, name, kind: ref.counterpartyKind ?? fallbackKind } };
    }
  };
}

export type CounterpartyService = ReturnType<typeof createCounterpartyService>;
