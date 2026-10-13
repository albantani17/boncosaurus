import { defaultCategories } from '../data/default-categories';
import type {
  BootstrapConfig,
  BootstrapRepository,
  BootstrapStatus
} from '../types/bootstrap.types';
import { isUniqueViolation } from '../utils/is-unique-violation';

type HashPassword = (password: string) => Promise<string>;

export async function bootstrapFirstRun(
  config: BootstrapConfig | null,
  repository: BootstrapRepository,
  hashPassword: HashPassword
): Promise<BootstrapStatus> {
  if (!config) return 'skipped';

  if ((await repository.countUsers()) > 0) {
    // Upgrade path: installs created before auth have an admin without a password.
    if (!(await repository.adminNeedsPassword(config.adminEmail))) return 'already-initialized';
    await repository.setAdminPassword(config.adminEmail, await hashPassword(config.adminPassword));
    return 'admin-password-set';
  }

  const { adminPassword, ...workspaceConfig } = config;
  try {
    await repository.createInitialWorkspace(
      { ...workspaceConfig, adminPasswordHash: await hashPassword(adminPassword) },
      defaultCategories
    );
    return 'created';
  } catch (error) {
    // A unique violation only means "lost the race" if the winner's user now exists.
    const lostRace = isUniqueViolation(error) && (await repository.countUsers()) > 0;
    if (lostRace) return 'already-initialized';
    throw error;
  }
}
