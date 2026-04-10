import { defineTask, generateToken } from '@illumiarqcore';
import { createHash } from 'node:crypto';
/**
 * Generates a secure email verification token (raw + SHA-256 hash).
 * The caller is responsible for storing the hash and sending the raw token via email.
 */
export const SendVerificationEmailTask = defineTask(async (_input) => {
  const token = generateToken(32);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
});
//# sourceMappingURL=send-verification-email.task.js.map
