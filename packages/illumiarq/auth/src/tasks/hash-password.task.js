import { defineTask } from '@illumiarqcore';
import { hashPassword } from '@illumiarqcore';
/**
 * Hashes a plain-text password using argon2id.
 */
export const HashPasswordTask = defineTask(async (plain) => hashPassword(plain));
//# sourceMappingURL=hash-password.task.js.map
