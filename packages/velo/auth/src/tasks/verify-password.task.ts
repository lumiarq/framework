import { defineTask } from '@velo/core';
import { verifyPassword } from '@velo/core';

export interface VerifyPasswordInput {
  plain: string;
  hash: string;
}

/**
 * Verifies a plain-text password against an argon2id hash.
 */
export const VerifyPasswordTask = defineTask(
  async ({ plain, hash }: VerifyPasswordInput): Promise<boolean> => verifyPassword(plain, hash),
);
