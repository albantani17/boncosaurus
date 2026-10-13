import { SignJWT, jwtVerify } from 'jose';

type AccessTokenOptions = { secret: string; ttlSeconds: number };

const ALGORITHM = 'HS256';

export function createAccessTokenService({ secret, ttlSeconds }: AccessTokenOptions) {
  const key = new TextEncoder().encode(secret);

  return {
    sign: (userId: string) =>
      new SignJWT({})
        .setProtectedHeader({ alg: ALGORITHM })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .sign(key),

    async verify(token: string): Promise<string | null> {
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: [ALGORITHM] });
        return payload.sub ?? null;
      } catch {
        return null;
      }
    }
  };
}
