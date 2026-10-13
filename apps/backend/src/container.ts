import { accountRepository } from './repositories/account.repository';
import { workspaceRepository } from './repositories/workspace.repository';
import { createAccountService } from './services/account.service';
import { createWorkspaceService } from './services/workspace.service';

export const workspaceService = createWorkspaceService(workspaceRepository);
export const accountService = createAccountService(accountRepository);
