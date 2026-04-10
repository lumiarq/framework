import { defineTask } from '@velo/core';
import { createHash } from 'node:crypto';

export interface VerifyEmailTokenInput {
  /** Raw token received from the verification link. */
  token: string;
  /** SHA-256 hash of the raw token as stored in the database. */
  tokenHash: string;
  /** Expiry timestamp for the verification token. */
  expiresAt: Date;
}

/**
 * Verifies a raw email verification token against a stored SHA-256 hash.
 * Returns true only if the hash matches and the token has not expired.
 */
export const VerifyEmailTokenTask = defineTask(
  async ({ token, tokenHash, expiresAt }: VerifyEmailTokenInput): Promise<boolean> => {
    if (Date.now() > expiresAt.getTime()) return false;
    const computedHash = createHash('sha256').update(token).digest('hex');
    return computedHash === tokenHash;
  },
);
