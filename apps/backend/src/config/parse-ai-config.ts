import type { SecretKey } from '../integrations/crypto/secret-box';

export type AiConfig = { secretKey: SecretKey | null };

type Env = Record<string, string | undefined>;

const KEY_BYTES = 32;

export function parseAiConfig(env: Env): AiConfig {
  const raw = env.AI_SECRET_KEY?.trim();
  if (!raw) return { secretKey: null };

  const secretKey = Uint8Array.from(Buffer.from(raw, 'base64'));
  if (secretKey.length !== KEY_BYTES) {
    throw new Error(`AI_SECRET_KEY must be ${KEY_BYTES} bytes encoded as base64 (openssl rand -base64 32)`);
  }
  return { secretKey };
}
