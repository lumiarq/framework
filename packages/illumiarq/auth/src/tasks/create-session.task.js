import { defineTask } from '@illumiarqcore';
/**
 * Creates a new session record with a hashed token.
 * The caller is responsible for hashing the token before passing it.
 */
export const CreateSessionTask = defineTask(async (data, repo) => repo.create(data));
//# sourceMappingURL=create-session.task.js.map
