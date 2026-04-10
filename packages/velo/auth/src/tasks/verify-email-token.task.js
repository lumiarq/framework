import { defineTask } from '@velo/core';
import { createHash } from 'node:crypto';
/**
 * Verifies a raw email verification token against a stored SHA-256 hash.
 * Returns true only if the hash matches and the token has not expired.
 */
export const VerifyEmailTokenTask = defineTask(async ({ token, tokenHash, expiresAt }) => {
  if (Date.now() > expiresAt.getTime()) return false;
  const computedHash = createHash('sha256').update(token).digest('hex');
  return computedHash === tokenHash;
});
//# sourceMappingURL=verify-email-token.task.js.map
