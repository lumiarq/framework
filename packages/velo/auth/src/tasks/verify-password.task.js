import { defineTask } from '@velo/core';
import { verifyPassword } from '@velo/core';
/**
 * Verifies a plain-text password against an argon2id hash.
 */
export const VerifyPasswordTask = defineTask(async ({ plain, hash }) =>
  verifyPassword(plain, hash),
);
//# sourceMappingURL=verify-password.task.js.map
