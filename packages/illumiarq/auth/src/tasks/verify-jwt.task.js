import { defineTask, verify } from '@illumiarqcore';
/**
 * Verifies a JWT and returns the decoded payload.
 * Throws if the token is invalid, expired, or signed with the wrong key.
 */
export const VerifyJwtTask = defineTask(async ({ token, publicKey }) => verify(token, publicKey));
//# sourceMappingURL=verify-jwt.task.js.map
