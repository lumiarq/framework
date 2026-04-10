import { defineAction, generateToken, AuthenticationError } from '@illumiarqcore';
import { createHash } from 'node:crypto';
import { VerifyPasswordTask } from '../tasks/verify-password.task.js';
import { IssueJwtTask } from '../tasks/issue-jwt.task.js';
import { CreateSessionTask } from '../tasks/create-session.task.js';
/**
 * Base login action. Verifies credentials, creates a session, issues a JWT.
 *
 * Application code wraps this action rather than modifying it.
 */
export const BaseLoginAction = defineAction(async (input, deps) => {
  const identity = await deps.identityRepo.findByEmail(input.email);
  if (!identity) throw new AuthenticationError();
  const valid = await VerifyPasswordTask({ plain: input.password, hash: identity.passwordHash });
  if (!valid) throw new AuthenticationError();
  const rawToken = generateToken(32);
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const ttl = deps.sessionTtlMs ?? 7 * 24 * 60 * 60 * 1000;
  const session = await CreateSessionTask(
    { userId: identity.id, tokenHash, expiresAt: new Date(Date.now() + ttl) },
    deps.sessionRepo,
  );
  const jwt = await IssueJwtTask({
    payload: { sub: identity.id },
    privateKey: deps.jwtPrivateKey,
  });
  return { identity, session, jwt, token: rawToken };
});
//# sourceMappingURL=base-login.action.js.map
