import type { categories } from '../db/schema';

export type BootstrapConfig = {
  adminEmail: string;
  adminName: string;
  workspaceName: string;
  baseCurrency: string;
};

export type DefaultCategory = {
  name: string;
  type: 'income' | 'expense';
  children?: string[];
};

export type CategoryRow = typeof categories.$inferInsert;

export type BootstrapStatus = 'created' | 'already-initialized' | 'skipped';

export type BootstrapRepository = {
  countUsers(): Promise<number>;
  createInitialWorkspace(config: BootstrapConfig, defaults: DefaultCategory[]): Promise<void>;
};
