import { defineTask, sign } from '@velo/core';
/**
 * Issues a JWT signed with RS256.
 */
export const IssueJwtTask = defineTask(async ({ payload, privateKey, opts }) =>
  sign(payload, privateKey, opts),
);
//# sourceMappingURL=issue-jwt.task.js.map
