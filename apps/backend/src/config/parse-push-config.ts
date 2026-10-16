export type PushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
  /** Local hour (process `TZ`) from which the daily reminder push may go out. */
  reminderHour: number;
};

type Env = Record<string, string | undefined>;

const DEFAULT_SUBJECT = 'mailto:admin@localhost';
const DEFAULT_REMINDER_HOUR = 8;
const SUBJECT_PATTERN = /^(mailto:|https:\/\/)/;

/** Web Push stays off (null) until both VAPID keys are set (`bunx web-push generate-vapid-keys`). */
export function parsePushConfig(env: Env): PushConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey && !privateKey) return null;
  if (!publicKey || !privateKey) throw new Error('Set both VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, or neither');

  const subject = env.VAPID_SUBJECT?.trim() || DEFAULT_SUBJECT;
  if (!SUBJECT_PATTERN.test(subject)) throw new Error('VAPID_SUBJECT must start with mailto: or https://');

  const rawHour = env.REMINDER_HOUR?.trim();
  const reminderHour = rawHour ? Number(rawHour) : DEFAULT_REMINDER_HOUR;
  if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    throw new Error('REMINDER_HOUR must be a whole hour from 0 to 23');
  }
  return { publicKey, privateKey, subject, reminderHour };
}
