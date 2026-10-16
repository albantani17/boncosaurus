export const INSTALLMENT_STATUSES = ['paid', 'partial', 'due', 'overdue'] as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];
