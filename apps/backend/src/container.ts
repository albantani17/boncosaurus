import { accountRepository } from './repositories/account.repository';
import { categoryRepository } from './repositories/category.repository';
import { refreshTokenRepository } from './repositories/refresh-token.repository';
import { transactionRepository } from './repositories/transaction.repository';
import { userRepository } from './repositories/user.repository';
import { workspaceRepository } from './repositories/workspace.repository';
import { createAccessTokenService } from './services/access-token.service';
import { createAccountService } from './services/account.service';
import { createAuthService } from './services/auth.service';
import { createCategoryService } from './services/category.service';
import { createTransactionService } from './services/transaction.service';
import { createWorkspaceService } from './services/workspace.service';
import { parseAuthConfig } from './utils/parse-auth-config';
import { DUMMY_PASSWORD_HASH, verifyPassword } from './utils/password';
import { generateRefreshToken, hashRefreshToken } from './utils/refresh-token';

export const authConfig = parseAuthConfig(process.env);

export const accessTokenService = createAccessTokenService({
  secret: authConfig.jwtSecret,
  ttlSeconds: authConfig.accessTtlSeconds
});
export const authService = createAuthService({
  users: userRepository,
  workspaces: workspaceRepository,
  refreshTokens: refreshTokenRepository,
  verifyPassword,
  dummyPasswordHash: DUMMY_PASSWORD_HASH,
  signAccessToken: accessTokenService.sign,
  generateRefreshToken,
  hashRefreshToken,
  generateFamilyId: () => Bun.randomUUIDv7(),
  now: () => new Date(),
  accessTtlSeconds: authConfig.accessTtlSeconds,
  refreshTtlSeconds: authConfig.refreshTtlSeconds
});

export const workspaceService = createWorkspaceService(workspaceRepository);
export const accountService = createAccountService(accountRepository);
export const categoryService = createCategoryService(categoryRepository);
export const transactionService = createTransactionService({
  transactions: transactionRepository,
  accounts: accountRepository,
  categories: categoryRepository
});
