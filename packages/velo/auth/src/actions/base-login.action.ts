import { defineAction, generateToken, AuthenticationError } from '@velo/core';
import { createHash } from 'node:crypto';
import type { IIdentityRepository, Identity } from '../contracts/identity-repository.js';
import type { ISessionRepository, Session } from '../contracts/session-repository.js';
import { VerifyPasswordTask } from '../tasks/verify-password.task.js';
import { IssueJwtTask } from '../tasks/issue-jwt.task.js';
import { CreateSessionTask } from '../tasks/create-session.task.js';

export interface BaseLoginInput {
  email: string;
  password: string;
}

export interface BaseLoginDeps {
  identityRepo: IIdentityRepository;
  sessionRepo: ISessionRepository;
  jwtPrivateKey: string;
  sessionTtlMs?: number; // default: 7 days
}

export interface BaseLoginResult {
  identity: Identity;
  session: Session;
  jwt: string;
  token: string; // raw session token — send to client, never store
}

/**
 * Base login action. Verifies credentials, creates a session, issues a JWT.
 *
 * Application code wraps this action rather than modifying it.
 */
export const BaseLoginAction = defineAction(
  async (input: BaseLoginInput, deps: BaseLoginDeps): Promise<BaseLoginResult> => {
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
  },
);
