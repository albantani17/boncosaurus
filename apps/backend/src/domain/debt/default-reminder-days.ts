import type { DebtSourceType } from '@boncosaurus/shared';

const PRODUCT_REMINDER_DAYS = 3;

/** Products bill on a fixed date, so they get a heads-up; friends are reminded on the day itself. */
export const defaultReminderDays = (sourceType: DebtSourceType): number =>
  sourceType === 'personal' ? 0 : PRODUCT_REMINDER_DAYS;
