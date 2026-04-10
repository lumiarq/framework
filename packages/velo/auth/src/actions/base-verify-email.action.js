import { defineAction } from '@velo/core';
import { VerifyEmailTokenTask } from '../tasks/verify-email-token.task.js';
/**
 * Base email verification action.
 * Verifies a raw email verification token against the stored SHA-256 hash.
 *
 * The caller is responsible for fetching the stored tokenHash and expiresAt
 * from the application's persistence layer and passing them as deps.
 * Application code wraps this action to mark the identity as email-verified.
 */
export const BaseVerifyEmailAction = defineAction(async (input, deps) => {
  const verified = await VerifyEmailTokenTask({
    token: input.token,
    tokenHash: deps.tokenHash,
    expiresAt: deps.expiresAt,
  });
  return { verified };
});
//# sourceMappingURL=base-verify-email.action.js.map
