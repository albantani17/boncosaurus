import { defaultCategories } from '../data/default-categories';
import type {
  BootstrapConfig,
  BootstrapRepository,
  BootstrapStatus
} from '../types/bootstrap.types';
import { isUniqueViolation } from '../utils/is-unique-violation';

export async function bootstrapFirstRun(
  config: BootstrapConfig | null,
  repository: BootstrapRepository
): Promise<BootstrapStatus> {
  if (!config) return 'skipped';
  if ((await repository.countUsers()) > 0) return 'already-initialized';

  try {
    await repository.createInitialWorkspace(config, defaultCategories);
    return 'created';
  } catch (error) {
    // A unique violation only means "lost the race" if the winner's user now exists.
    const lostRace = isUniqueViolation(error) && (await repository.countUsers()) > 0;
    if (lostRace) return 'already-initialized';
    throw error;
  }
}
