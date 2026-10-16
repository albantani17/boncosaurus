import { and, asc, count, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { counterparties, debts } from '../db/schema';
import type { Counterparty, CounterpartyPatch, NewCounterparty } from '../types/debt.types';

export type CounterpartyRepository = {
  list(workspaceId: string): Promise<Counterparty[]>;
  findById(workspaceId: string, id: string): Promise<Counterparty | undefined>;
  findByName(workspaceId: string, name: string): Promise<Counterparty | undefined>;
  insert(values: NewCounterparty): Promise<Counterparty>;
  update(workspaceId: string, id: string, patch: CounterpartyPatch): Promise<Counterparty | undefined>;
  delete(workspaceId: string, id: string): Promise<void>;
  countDebts(workspaceId: string, id: string): Promise<number>;
};

const inWorkspace = (workspaceId: string, id: string) =>
  and(eq(counterparties.workspaceId, workspaceId), eq(counterparties.id, id));

export const counterpartyRepository: CounterpartyRepository = {
  list: (workspaceId) =>
    db
      .select()
      .from(counterparties)
      .where(eq(counterparties.workspaceId, workspaceId))
      .orderBy(asc(counterparties.name)),

  async findById(workspaceId, id) {
    const [row] = await db.select().from(counterparties).where(inWorkspace(workspaceId, id));
    return row;
  },

  async findByName(workspaceId, name) {
    const [row] = await db
      .select()
      .from(counterparties)
      .where(
        and(eq(counterparties.workspaceId, workspaceId), sql`lower(${counterparties.name}) = lower(${name})`)
      );
    return row;
  },

  async insert(values) {
    const [row] = await db.insert(counterparties).values(values).returning();
    return row!;
  },

  async update(workspaceId, id, patch) {
    const [row] = await db.update(counterparties).set(patch).where(inWorkspace(workspaceId, id)).returning();
    return row;
  },

  async delete(workspaceId, id) {
    await db.delete(counterparties).where(inWorkspace(workspaceId, id));
  },

  // Deleted debts still reference the counterparty, so they count too.
  async countDebts(workspaceId, id) {
    const [row] = await db
      .select({ value: count() })
      .from(debts)
      .where(and(eq(debts.workspaceId, workspaceId), eq(debts.counterpartyId, id)));
    return row?.value ?? 0;
  }
};
