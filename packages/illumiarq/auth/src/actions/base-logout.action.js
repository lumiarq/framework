import { defineAction } from '@illumiarqcore';
import { RevokeSessionTask } from '../tasks/revoke-session.task.js';
/**
 * Base logout action. Revokes the current session by ID.
 */
export const BaseLogoutAction = defineAction(async (input, deps) => {
  await RevokeSessionTask(input.sessionId, deps.sessionRepo);
});
//# sourceMappingURL=base-logout.action.js.map
