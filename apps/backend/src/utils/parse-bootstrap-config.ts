import type { BootstrapConfig } from '../types/bootstrap.types';
import { MIN_PASSWORD_LENGTH } from './password';

type Env = Record<string, string | undefined>;

const DEFAULT_WORKSPACE_NAME = 'Keuangan Saya';
const DEFAULT_BASE_CURRENCY = 'IDR';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const readValue = (env: Env, key: string) => env[key]?.trim() || undefined;

export function parseBootstrapConfig(env: Env): BootstrapConfig | null {
  const adminEmail = readValue(env, 'ADMIN_EMAIL')?.toLowerCase();
  if (!adminEmail) return null;

  if (!EMAIL_PATTERN.test(adminEmail)) {
    throw new Error(`ADMIN_EMAIL is not a valid email: ${adminEmail}`);
  }

  const adminPassword = env.ADMIN_PASSWORD ?? '';
  if (adminPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD is required and must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const baseCurrency = readValue(env, 'BASE_CURRENCY') ?? DEFAULT_BASE_CURRENCY;
  if (!CURRENCY_PATTERN.test(baseCurrency)) {
    throw new Error(`BASE_CURRENCY must be 3 uppercase letters: ${baseCurrency}`);
  }

  return {
    adminEmail,
    adminPassword,
    adminName: readValue(env, 'ADMIN_NAME') ?? adminEmail.split('@')[0]!,
    workspaceName: readValue(env, 'WORKSPACE_NAME') ?? DEFAULT_WORKSPACE_NAME,
    baseCurrency
  };
}
