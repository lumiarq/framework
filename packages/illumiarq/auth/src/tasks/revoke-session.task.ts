import { defineTask } from '@illumiarq/core';
import type { ISessionRepository } from '../contracts/session-repository.js';

/**
 * Revokes a session by its ID.
 */
export const RevokeSessionTask = defineTask(
  async (sessionId: string, repo: ISessionRepository): Promise<void> => repo.revoke(sessionId),
);
