import { defineAction } from '@illumiarqcore';
import { HashPasswordTask } from '../tasks/hash-password.task.js';
/**
 * Base register action. Hashes password and creates a new identity record.
 * Does NOT create a session or issue a JWT — login action handles that.
 * Application code wraps this action to add extra validation or emit events.
 */
export const BaseRegisterAction = defineAction(async (input, deps) => {
  const passwordHash = await HashPasswordTask(input.password);
  return deps.identityRepo.create({ email: input.email, passwordHash });
});
//# sourceMappingURL=base-register.action.js.map
