import { defineTask } from '@illumiarq/core';
import type {
  ISessionRepository,
  CreateSessionData,
  Session,
} from '../contracts/session-repository.js';

/**
 * Creates a new session record with a hashed token.
 * The caller is responsible for hashing the token before passing it.
 */
export const CreateSessionTask = defineTask(
  async (data: CreateSessionData, repo: ISessionRepository): Promise<Session> => repo.create(data),
);
