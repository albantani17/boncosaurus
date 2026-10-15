import type {
  AccountWithBalanceDto,
  AiProviderDto,
  Assert,
  CategoryDto,
  ConversationDto,
  ConversationWithMessages as ConversationWithMessagesDto,
  IsAssignable,
  Jsonify,
  PeriodSummaryDto,
  Profile as ProfileDto,
  TransactionDto
} from '@boncosaurus/shared';
import type { AccountWithBalance } from '../services/account/account.service';
import type { Profile } from '../services/auth/auth.service';
import type { ConversationWithMessages } from '../services/chat/chat.service';
import type { ChatConversation, PublicAiProvider } from './ai.types';
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
  Assert<Serves<ConversationWithMessages, ConversationWithMessagesDto>>
];
