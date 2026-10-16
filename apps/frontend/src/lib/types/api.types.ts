export type {
	AccountWithBalanceDto as Account,
	CategoryDto as Category,
	CategoryTotal,
	CategoryType,
	CounterpartyDto as Counterparty,
	CurrencyTotals,
	DebtDetailDto as DebtDetail,
	DebtDirection,
	DebtDto as Debt,
	DebtInstallmentDto as DebtInstallment,
	DebtPaymentDto as DebtPayment,
	DebtReminderDto as DebtReminder,
	DebtSourceType,
	DebtStatus,
	DebtSummaryDto as DebtSummary,
	InstallmentStatus,
	PeriodSummaryDto as PeriodSummary,
	PushConfigDto as PushConfig,
	Profile,
	PublicUser,
	TransactionDto as Transaction,
	TransactionType,
	WorkspaceMembership
} from '@boncosaurus/shared';

export type MascotState = 'idle' | 'happy' | 'warning';
