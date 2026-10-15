import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../../errors/app-error';
import type { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import type { UserRepository } from '../../repositories/user.repository';
import type { ProfilePatch, PublicUser, UserRecord } from '../../types/auth.types';
import type { ServiceLogger } from '../../types/logger.types';
import { isUniqueViolation } from '../../utils/is-unique-violation';

type Dependencies = {
  users: Pick<UserRepository, 'findById' | 'updateProfile' | 'setPasswordHash'>;
  refreshTokens: Pick<RefreshTokenRepository, 'revokeAllForUser'>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
  logger: ServiceLogger;
};

export type UpdateProfileInput = ProfilePatch & { currentPassword?: string };

const toPublicUser = ({ id, email, name }: UserRecord): PublicUser => ({ id, email, name });

export function createProfileService(deps: Dependencies) {
  async function requireUser(userId: string) {
    const user = await deps.users.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async function assertPasswordMatches(user: UserRecord, password: string | undefined) {
    if (!password) {
      throw new BadRequestError('PASSWORD_REQUIRED', 'Current password is required for this change');
    }
    const matches = user.passwordHash ? await deps.verifyPassword(password, user.passwordHash) : false;
    if (!matches) throw new UnauthorizedError('INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  return {
    async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
      const user = await requireUser(userId);
      const email = input.email?.trim().toLowerCase();
      const name = input.name?.trim();
      const isChangingEmail = email !== undefined && email !== user.email;
      if (isChangingEmail) await assertPasswordMatches(user, input.currentPassword);

      const patch: ProfilePatch = {
        ...(name ? { name } : {}),
        ...(isChangingEmail ? { email } : {})
      };
      if (Object.keys(patch).length === 0) return toPublicUser(user);

      try {
        const updated = await deps.users.updateProfile(userId, patch);
        if (!updated) throw new NotFoundError('User');
        if (isChangingEmail) deps.logger.info({ event: 'auth.email_changed', userId }, 'email changed');
        return toPublicUser(updated);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictError('EMAIL_TAKEN', 'This email is already used by another account');
        }
        throw error;
      }
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
      const user = await requireUser(userId);
      await assertPasswordMatches(user, currentPassword);
      if (currentPassword === newPassword) {
        throw new BadRequestError('SAME_PASSWORD', 'New password must differ from the current one');
      }

      await deps.users.setPasswordHash(userId, await deps.hashPassword(newPassword));
      await deps.refreshTokens.revokeAllForUser(userId);
      deps.logger.info({ event: 'auth.password_changed', userId }, 'password changed');
    }
  };
}
