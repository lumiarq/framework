import { defineTask } from '@illumiarqcore';
import { verifyPassword } from '@illumiarqcore';
/**
 * Verifies a plain-text password against an argon2id hash.
 */
export const VerifyPasswordTask = defineTask(async ({ plain, hash }) =>
  verifyPassword(plain, hash),
);
//# sourceMappingURL=verify-password.task.js.map
