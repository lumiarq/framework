import { defineAction } from '@velo/core';
import { SendVerificationEmailTask } from '../tasks/send-verification-email.task.js';
/**
 * Base resend-verification-email action.
 * Generates a new email verification token (raw + SHA-256 hash) and delegates
 * storage and email delivery to the onTokenGenerated callback.
 * Application code wraps this action to wire in the mailer and repository update.
 */
export const BaseResendVerificationEmailAction = defineAction(async (input, deps) => {
  const { token, tokenHash } = await SendVerificationEmailTask({
    identityId: input.identityId,
    email: input.email,
  });
  await deps.onTokenGenerated({
    identityId: input.identityId,
    email: input.email,
    token,
    tokenHash,
  });
});
//# sourceMappingURL=base-resend-verification-email.action.js.map
