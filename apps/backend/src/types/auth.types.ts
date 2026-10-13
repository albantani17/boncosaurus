import type { refreshTokens, users } from '../db/schema';

export type UserRecord = typeof users.$inferSelect;
export type PublicUser = Pick<UserRecord, 'id' | 'email' | 'name'>;

export type RefreshTokenRecord = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = Pick<
  typeof refreshTokens.$inferInsert,
  'userId' | 'familyId' | 'tokenHash' | 'expiresAt'
>;

export type WorkspaceMembership = {
  id: string;
  name: string;
  baseCurrency: string;
  role: 'owner' | 'admin' | 'member';
};

export type AuthTokens = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshMaxAgeSeconds: number;
};
