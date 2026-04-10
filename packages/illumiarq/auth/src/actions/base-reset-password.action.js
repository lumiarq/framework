import { defineAction } from '@illumiarqcore';
import { HashPasswordTask } from '../tasks/hash-password.task.js';
/**
 * Base reset-password action.
 * Hashes the new password and updates the identity record.
 * Token validation is caller's responsibility (application layer).
 */
export const BaseResetPasswordAction = defineAction(async (input, deps) => {
  const passwordHash = await HashPasswordTask(input.newPassword);
  await deps.identityRepo.updatePassword(input.userId, passwordHash);
});
//# sourceMappingURL=base-reset-password.action.js.map
