import type { AccountType } from '../constants/account-types';

export type AccountDto = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  isArchived: boolean;
};

export type AccountWithBalanceDto = AccountDto & { balance: number };

export type CreateAccountBody = {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance?: number;
  sortOrder?: number;
};

export type UpdateAccountBody = Partial<CreateAccountBody> & { isArchived?: boolean };
