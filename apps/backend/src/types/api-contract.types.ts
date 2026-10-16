import type {
  AccountWithBalanceDto,
  AiProviderDto,
  Assert,
  CategoryDto,
  ConversationDto,
  ConversationWithMessages as ConversationWithMessagesDto,
  CounterpartyDto,
  DebtDetailDto,
  DebtDto,
  DebtReminderDto,
  DebtSummaryDto,
  IsAssignable,
  Jsonify,
  PeriodSummaryDto,
  Profile as ProfileDto,
  TransactionDto
} from '@boncosaurus/shared';
import type { AccountWithBalance } from '../services/account/account.service';
import type { Profile } from '../services/auth/auth.service';
import type { ConversationWithMessages } from '../services/chat/chat.service';
import type { DebtDetail, DebtView } from '../domain/debt/build-debt-view';
import type { DebtSummary } from '../domain/debt/summarize-debts';
import type { DebtReminder } from '../domain/debt/select-due-reminders';
import type { ChatConversation, PublicAiProvider } from './ai.types';
import type { Counterparty } from './debt.types';
import type { Category, Transaction } from './finance.types';
import type { PeriodSummary } from './report.types';

// Compile-time proof that what the backend serializes satisfies the DTOs the frontend reads.
type Serves<Backend, Dto> = IsAssignable<Jsonify<Backend>, Dto>;

export type ApiResponseContracts = [
  Assert<Serves<AccountWithBalance, AccountWithBalanceDto>>,
  Assert<Serves<Category, CategoryDto>>,
  Assert<Serves<Transaction, TransactionDto>>,
  Assert<Serves<PeriodSummary, PeriodSummaryDto>>,
  Assert<Serves<Profile, ProfileDto>>,
  Assert<Serves<PublicAiProvider, AiProviderDto>>,
  Assert<Serves<ChatConversation, ConversationDto>>,
  Assert<Serves<ConversationWithMessages, ConversationWithMessagesDto>>,
  Assert<Serves<Counterparty, CounterpartyDto>>,
  Assert<Serves<DebtView, DebtDto>>,
  Assert<Serves<DebtDetail, DebtDetailDto>>,
  Assert<Serves<DebtSummary, DebtSummaryDto>>,
  Assert<Serves<DebtReminder, DebtReminderDto>>
];
