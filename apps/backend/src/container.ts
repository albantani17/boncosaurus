import { accountRepository } from './repositories/account.repository';
import { categoryRepository } from './repositories/category.repository';
import { transactionRepository } from './repositories/transaction.repository';
import { workspaceRepository } from './repositories/workspace.repository';
import { createAccountService } from './services/account.service';
import { createCategoryService } from './services/category.service';
import { createTransactionService } from './services/transaction.service';
import { createWorkspaceService } from './services/workspace.service';

export const workspaceService = createWorkspaceService(workspaceRepository);
export const accountService = createAccountService(accountRepository);
export const categoryService = createCategoryService(categoryRepository);
export const transactionService = createTransactionService({
  transactions: transactionRepository,
  accounts: accountRepository,
  categories: categoryRepository
});
