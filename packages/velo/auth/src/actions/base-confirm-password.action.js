import { defineAction } from '@velo/core';
import { VerifyPasswordTask } from '../tasks/verify-password.task.js';
import { ConfirmPasswordTask } from '../tasks/confirm-password.task.js';
/**
 * Base confirm-password action.
 * Verifies the user's current password and records the confirmation timestamp.
 * Application code wraps this action to persist passwordConfirmedAt.
 */
export const BaseConfirmPasswordAction = defineAction(async (input, deps) => {
  const identity = await deps.identityRepo.findById(input.identityId);
  if (!identity) return { confirmed: false };
  const valid = await VerifyPasswordTask({ plain: input.password, hash: identity.passwordHash });
  if (!valid) return { confirmed: false };
  await ConfirmPasswordTask({ identityId: input.identityId });
  return { confirmed: true };
});
//# sourceMappingURL=base-confirm-password.action.js.map
