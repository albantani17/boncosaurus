import type { refreshTokens, users } from '../db/schema';

export type UserRecord = typeof users.$inferSelect;
export type PublicUser = Pick<UserRecord, 'id' | 'email' | 'name'>;
export type ProfilePatch = Partial<Pick<UserRecord, 'name' | 'email'>>;

export type RefreshTokenRecord = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = Pick<
  typeof refreshTokens.$inferInsert,
  'userId' | 'familyId' | 'tokenHash' | 'expiresAt'
>;

export type { WorkspaceMembership } from '@boncosaurus/shared';

export type AuthTokens = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshMaxAgeSeconds: number;
};
