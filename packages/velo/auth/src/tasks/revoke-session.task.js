import { defineTask } from '@velo/core';
/**
 * Revokes a session by its ID.
 */
export const RevokeSessionTask = defineTask(async (sessionId, repo) => repo.revoke(sessionId));
//# sourceMappingURL=revoke-session.task.js.map
