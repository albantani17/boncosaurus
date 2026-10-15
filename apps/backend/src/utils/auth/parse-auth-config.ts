export type AuthConfig = {
  jwtSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  cookieSecure: boolean;
  frontendOrigin: string;
};

type Env = Record<string, string | undefined>;

const MIN_SECRET_LENGTH = 32;
const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

const readValue = (env: Env, key: string) => env[key]?.trim() || undefined;

function readPositiveInteger(env: Env, key: string, fallback: number): number {
  const raw = readValue(env, key);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer: ${raw}`);
  }
  return value;
}

export function parseAuthConfig(env: Env): AuthConfig {
  const jwtSecret = readValue(env, 'JWT_SECRET');
  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET is required and must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  const isProduction = readValue(env, 'NODE_ENV') === 'production';

  return {
    jwtSecret,
    accessTtlSeconds: readPositiveInteger(env, 'ACCESS_TOKEN_TTL_SECONDS', DEFAULT_ACCESS_TTL_SECONDS),
    refreshTtlSeconds: readPositiveInteger(env, 'REFRESH_TOKEN_TTL_SECONDS', DEFAULT_REFRESH_TTL_SECONDS),
    cookieSecure: (readValue(env, 'COOKIE_SECURE') ?? String(isProduction)) === 'true',
    frontendOrigin: readValue(env, 'FRONTEND_ORIGIN') ?? DEFAULT_FRONTEND_ORIGIN
  };
}
