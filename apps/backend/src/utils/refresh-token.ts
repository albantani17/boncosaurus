const TOKEN_BYTES = 32;

export function generateRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return Buffer.from(bytes).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return new Bun.CryptoHasher('sha256').update(token).digest('hex');
}
