import { defineAction, generateToken } from '@illumiarqcore';
import { createHash } from 'node:crypto';
/**
 * Base forgot-password action.
 * Generates a password reset token (raw + hash).
 * The caller is responsible for storing the hash and sending the raw token via email.
 */
export const BaseForgotPasswordAction = defineAction(async (input, deps) => {
  const identity = await deps.identityRepo.findByEmail(input.email);
  const token = generateToken(32);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return { found: !!identity, token, tokenHash };
});
//# sourceMappingURL=base-forgot-password.action.js.map
