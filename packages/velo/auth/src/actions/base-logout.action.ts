import { defineAction } from '@velo/core';
import type { ISessionRepository } from '../contracts/session-repository.js';
import { RevokeSessionTask } from '../tasks/revoke-session.task.js';

export interface BaseLogoutInput {
  sessionId: string;
}

export interface BaseLogoutDeps {
  sessionRepo: ISessionRepository;
}

/**
 * Base logout action. Revokes the current session by ID.
 */
export const BaseLogoutAction = defineAction(
  async (input: BaseLogoutInput, deps: BaseLogoutDeps): Promise<void> => {
    await RevokeSessionTask(input.sessionId, deps.sessionRepo);
  },
);
