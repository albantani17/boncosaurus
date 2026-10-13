import type { categories } from '../db/schema';

export type BootstrapConfig = {
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  workspaceName: string;
  baseCurrency: string;
};

export type DefaultCategory = {
  name: string;
  type: 'income' | 'expense';
  children?: string[];
};

export type CategoryRow = typeof categories.$inferInsert;

export type InitialWorkspaceInput = Omit<BootstrapConfig, 'adminPassword'> & {
  adminPasswordHash: string;
};

export type BootstrapStatus = 'created' | 'admin-password-set' | 'already-initialized' | 'skipped';

export type BootstrapRepository = {
  countUsers(): Promise<number>;
  createInitialWorkspace(input: InitialWorkspaceInput, defaults: DefaultCategory[]): Promise<void>;
  adminNeedsPassword(email: string): Promise<boolean>;
  setAdminPassword(email: string, passwordHash: string): Promise<void>;
};
