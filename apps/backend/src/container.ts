import { aiProviderRepository } from './repositories/ai-provider.repository';
import { accountRepository } from './repositories/account.repository';
import { chatRepository } from './repositories/chat.repository';
import { categoryRepository } from './repositories/category.repository';
import { counterpartyRepository } from './repositories/counterparty.repository';
import { debtRepository } from './repositories/debt.repository';
import { pushRepository } from './repositories/push.repository';
import { importRepository } from './repositories/import.repository';
import { refreshTokenRepository } from './repositories/refresh-token.repository';
import { reportRepository } from './repositories/report.repository';
import { transactionRepository } from './repositories/transaction.repository';
import { userRepository } from './repositories/user.repository';
import { workspaceRepository } from './repositories/workspace.repository';
import { createAccessTokenService } from './services/auth/access-token.service';
import { createAiProviderService } from './services/ai-provider/ai-provider.service';
import { createAccountService } from './services/account/account.service';
import { createAuthService } from './services/auth/auth.service';
import { createChatService } from './services/chat/chat.service';
import { createProposalActions } from './services/chat/proposal-actions';
import { createPushService } from './services/push/push.service';
import { createReminderDigestService } from './services/push/reminder-digest.service';
import { createCategoryService } from './services/category/category.service';
import { createCounterpartyService } from './services/counterparty/counterparty.service';
import { createDebtPaymentService } from './services/debt/debt-payment.service';
import { createDebtService } from './services/debt/debt.service';
import { createSplitExpenseService } from './services/debt/split-expense.service';
import { createImportAi } from './services/import/import-ai';
import { createImportCommitService } from './services/import/import-commit.service';
import { createImportPreviewService } from './services/import/import-preview.service';
import { createProfileService } from './services/auth/profile.service';
import { createReportService } from './services/report/report.service';
import { createTransactionService } from './services/transaction/transaction.service';
import { createWorkspaceService } from './services/workspace/workspace.service';
import { createLanguageModel } from './integrations/ai/create-language-model';
import { parseAiConfig } from './config/parse-ai-config';
import { parseAuthConfig } from './config/parse-auth-config';
import { parseLogConfig } from './config/parse-log-config';
import { parsePushConfig } from './config/parse-push-config';
import { createWebPushSender } from './integrations/push/send-web-push';
import { createLogger } from './integrations/logging/create-logger';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './integrations/crypto/password';
import { listProviderModels } from './integrations/ai/list-provider-models';
import { probeLanguageModel } from './integrations/ai/probe-language-model';
import { generateRefreshToken, hashRefreshToken } from './integrations/crypto/refresh-token';
import { decryptSecret, encryptSecret } from './integrations/crypto/secret-box';

export const logger = createLogger(parseLogConfig(process.env));
export const authConfig = parseAuthConfig(process.env);
export const aiConfig = parseAiConfig(process.env);
export const pushConfig = parsePushConfig(process.env);

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
  refreshTtlSeconds: authConfig.refreshTtlSeconds,
  logger
});

export const profileService = createProfileService({
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  verifyPassword,
  hashPassword,
  logger
});

export const workspaceService = createWorkspaceService(workspaceRepository);
export const accountService = createAccountService(accountRepository);
export const categoryService = createCategoryService(categoryRepository);
export const reportService = createReportService(reportRepository);
export const transactionService = createTransactionService({
  transactions: transactionRepository,
  accounts: accountRepository,
  categories: categoryRepository,
  debts: debtRepository
});

export const counterpartyService = createCounterpartyService({
  repository: counterpartyRepository,
  generateId: () => Bun.randomUUIDv7()
});
export const debtService = createDebtService({
  debts: debtRepository,
  counterparties: counterpartyService,
  accounts: accountRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  generateId: () => Bun.randomUUIDv7(),
  now: () => new Date()
});
export const debtPaymentService = createDebtPaymentService({
  debts: debtRepository,
  debtService,
  accounts: accountRepository,
  categories: categoryRepository,
  generateId: () => Bun.randomUUIDv7(),
  now: () => new Date()
});
export const splitExpenseService = createSplitExpenseService({
  debts: debtRepository,
  transactions: transactionRepository,
  transactionService,
  counterparties: counterpartyService,
  accounts: accountRepository,
  generateId: () => Bun.randomUUIDv7()
});

export const aiProviderService = createAiProviderService({
  providers: aiProviderRepository,
  workspaces: workspaceRepository,
  secretKey: aiConfig.secretKey,
  encryptSecret,
  decryptSecret,
  probeModel: probeLanguageModel,
  fetchModels: (settings) => listProviderModels(settings),
  logger
});

export const chatService = createChatService({
  chats: chatRepository,
  providers: aiProviderService,
  workspaces: workspaceRepository,
  tools: {
    reports: reportService,
    accounts: accountService,
    categories: categoryService,
    transactions: transactionService,
    splitExpenses: splitExpenseService,
    debts: debtService,
    debtPayments: debtPaymentService
  },
  proposals: createProposalActions({
    transactions: transactionService,
    splitExpenses: splitExpenseService,
    debts: debtService,
    debtPayments: debtPaymentService
  }),
  createModel: createLanguageModel,
  generateId: () => Bun.randomUUIDv7(),
  now: () => new Date(),
  logger
});

export const importPreviewService = createImportPreviewService({
  ai: createImportAi(createLanguageModel),
  providers: aiProviderService,
  workspaces: workspaceRepository,
  accounts: accountRepository,
  categories: categoryRepository,
  imports: importRepository,
  now: () => new Date(),
  logger
});

export const importCommitService = createImportCommitService({
  accounts: accountRepository,
  categories: categoryRepository,
  imports: importRepository,
  generateId: () => Bun.randomUUIDv7()
});

export const pushService = createPushService({
  config: pushConfig,
  repository: pushRepository,
  send: pushConfig ? createWebPushSender(pushConfig) : null,
  logger
});

export const reminderDigestService = createReminderDigestService({
  config: pushConfig,
  repository: pushRepository,
  debts: debtService,
  push: pushService,
  now: () => new Date()
});
