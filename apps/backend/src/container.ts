import { aiProviderRepository } from './repositories/ai-provider.repository';
import { accountRepository } from './repositories/account.repository';
import { chatRepository } from './repositories/chat.repository';
import { categoryRepository } from './repositories/category.repository';
import { importRepository } from './repositories/import.repository';
import { refreshTokenRepository } from './repositories/refresh-token.repository';
import { reportRepository } from './repositories/report.repository';
import { transactionRepository } from './repositories/transaction.repository';
import { userRepository } from './repositories/user.repository';
import { workspaceRepository } from './repositories/workspace.repository';
import { createAccessTokenService } from './services/access-token.service';
import { createAiProviderService } from './services/ai-provider.service';
import { createAccountService } from './services/account.service';
import { createAuthService } from './services/auth.service';
import { createChatService } from './services/chat.service';
import { createCategoryService } from './services/category.service';
import { createImportAi } from './services/import-ai';
import { createImportCommitService } from './services/import-commit.service';
import { createImportPreviewService } from './services/import-preview.service';
import { createProfileService } from './services/profile.service';
import { createReportService } from './services/report.service';
import { createTransactionService } from './services/transaction.service';
import { createWorkspaceService } from './services/workspace.service';
import { createLanguageModel } from './utils/create-language-model';
import { parseAiConfig } from './utils/parse-ai-config';
import { parseAuthConfig } from './utils/parse-auth-config';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './utils/password';
import { listProviderModels } from './utils/list-provider-models';
import { probeLanguageModel } from './utils/probe-language-model';
import { generateRefreshToken, hashRefreshToken } from './utils/refresh-token';
import { decryptSecret, encryptSecret } from './utils/secret-box';

export const authConfig = parseAuthConfig(process.env);
export const aiConfig = parseAiConfig(process.env);

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

export const profileService = createProfileService({
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  verifyPassword,
  hashPassword
});

export const workspaceService = createWorkspaceService(workspaceRepository);
export const accountService = createAccountService(accountRepository);
export const categoryService = createCategoryService(categoryRepository);
export const reportService = createReportService(reportRepository);
export const transactionService = createTransactionService({
  transactions: transactionRepository,
  accounts: accountRepository,
  categories: categoryRepository
});

export const aiProviderService = createAiProviderService({
  providers: aiProviderRepository,
  workspaces: workspaceRepository,
  secretKey: aiConfig.secretKey,
  encryptSecret,
  decryptSecret,
  probeModel: probeLanguageModel,
  fetchModels: (settings) => listProviderModels(settings)
});

export const chatService = createChatService({
  chats: chatRepository,
  providers: aiProviderService,
  workspaces: workspaceRepository,
  tools: {
    reports: reportService,
    accounts: accountService,
    categories: categoryService,
    transactions: transactionService
  },
  transactions: transactionService,
  createModel: createLanguageModel,
  generateId: () => Bun.randomUUIDv7(),
  now: () => new Date()
});

export const importPreviewService = createImportPreviewService({
  ai: createImportAi(createLanguageModel),
  providers: aiProviderService,
  workspaces: workspaceRepository,
  accounts: accountRepository,
  categories: categoryRepository,
  imports: importRepository,
  now: () => new Date()
});

export const importCommitService = createImportCommitService({
  accounts: accountRepository,
  categories: categoryRepository,
  imports: importRepository,
  generateId: () => Bun.randomUUIDv7()
});
