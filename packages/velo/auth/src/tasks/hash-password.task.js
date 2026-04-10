import { defineTask } from '@velo/core';
import { hashPassword } from '@velo/core';
/**
 * Hashes a plain-text password using argon2id.
 */
export const HashPasswordTask = defineTask(async (plain) => hashPassword(plain));
//# sourceMappingURL=hash-password.task.js.map
