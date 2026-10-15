import { UnauthorizedError } from '../../errors/app-error';
import type { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import type { UserRepository } from '../../repositories/user.repository';
import type { WorkspaceRepository } from '../../repositories/workspace.repository';
import type { AuthTokens, PublicUser, WorkspaceMembership } from '../../types/auth.types';
import type { ServiceLogger } from '../../types/logger.types';

type Dependencies = {
  users: Pick<UserRepository, 'findByEmail' | 'findById'>;
  workspaces: Pick<WorkspaceRepository, 'listForUser'>;
  refreshTokens: Omit<RefreshTokenRepository, 'revokeAllForUser'>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  dummyPasswordHash: string;
  signAccessToken: (userId: string) => Promise<string>;
  generateRefreshToken: () => string;
  hashRefreshToken: (token: string) => string;
  generateFamilyId: () => string;
  now: () => Date;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  logger: ServiceLogger;
};

export type LoginResult = AuthTokens & { user: PublicUser };
export type Profile = { user: PublicUser; workspaces: WorkspaceMembership[] };

const toPublicUser = ({ id, email, name }: PublicUser): PublicUser => ({ id, email, name });

export function createAuthService(deps: Dependencies) {
  const refreshExpiry = () => new Date(deps.now().getTime() + deps.refreshTtlSeconds * 1000);

  async function issueAccessToken(userId: string) {
    return { accessToken: await deps.signAccessToken(userId), expiresIn: deps.accessTtlSeconds };
  }

  async function startSession(userId: string): Promise<AuthTokens> {
    const refreshToken = deps.generateRefreshToken();
    await deps.refreshTokens.insert({
      userId,
      familyId: deps.generateFamilyId(),
      tokenHash: deps.hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry()
    });
    return {
      ...(await issueAccessToken(userId)),
      refreshToken,
      refreshMaxAgeSeconds: deps.refreshTtlSeconds
    };
  }

  return {
    startSession,

    async login(email: string, password: string): Promise<LoginResult> {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await deps.users.findByEmail(normalizedEmail);
      const passwordMatches = await deps.verifyPassword(
        password,
        user?.passwordHash ?? deps.dummyPasswordHash
      );
      if (!user?.passwordHash || !passwordMatches) {
        deps.logger.warn({ event: 'auth.login_failed', email: normalizedEmail }, 'login failed');
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
      }

      deps.logger.info({ event: 'auth.login', userId: user.id }, 'login');
      return { user: toPublicUser(user), ...(await startSession(user.id)) };
    },

    async refresh(refreshToken: string): Promise<AuthTokens> {
      const current = await deps.refreshTokens.findByHash(deps.hashRefreshToken(refreshToken));
      if (!current) {
        throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is not valid');
      }

      const rejectAsReused = async () => {
        await deps.refreshTokens.revokeFamily(current.familyId);
        deps.logger.warn(
          { event: 'auth.refresh_reused', userId: current.userId, familyId: current.familyId },
          'refresh token reused, session family revoked'
        );
        throw new UnauthorizedError('REFRESH_TOKEN_REUSED', 'Refresh token was already used');
      };

      if (current.revokedAt) return rejectAsReused();
      if (current.expiresAt <= deps.now()) {
        throw new UnauthorizedError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
      }

      const user = await deps.users.findById(current.userId);
      if (!user) throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is not valid');

      const nextToken = deps.generateRefreshToken();
      const rotated = await deps.refreshTokens.rotate(current.id, {
        userId: current.userId,
        familyId: current.familyId,
        tokenHash: deps.hashRefreshToken(nextToken),
        expiresAt: refreshExpiry()
      });
      if (!rotated) return rejectAsReused();

      return {
        ...(await issueAccessToken(current.userId)),
        refreshToken: nextToken,
        refreshMaxAgeSeconds: deps.refreshTtlSeconds
      };
    },

    async logout(refreshToken: string | undefined): Promise<void> {
      if (!refreshToken) return;
      const current = await deps.refreshTokens.findByHash(deps.hashRefreshToken(refreshToken));
      if (!current) return;
      await deps.refreshTokens.revokeFamily(current.familyId);
      deps.logger.info({ event: 'auth.logout', userId: current.userId }, 'logout');
    },

    async getProfile(userId: string): Promise<Profile> {
      const user = await deps.users.findById(userId);
      if (!user) throw new UnauthorizedError('UNAUTHENTICATED', 'User no longer exists');
      return { user: toPublicUser(user), workspaces: await deps.workspaces.listForUser(userId) };
    }
  };
}
