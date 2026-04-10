import { defineAction } from '@velo/core';
import type { IIdentityRepository, Identity } from '../contracts/identity-repository.js';
import { HashPasswordTask } from '../tasks/hash-password.task.js';

export interface BaseRegisterInput {
  email: string;
  password: string;
}

export interface BaseRegisterDeps {
  identityRepo: IIdentityRepository;
}

/**
 * Base register action. Hashes password and creates a new identity record.
 * Does NOT create a session or issue a JWT — login action handles that.
 * Application code wraps this action to add extra validation or emit events.
 */
export const BaseRegisterAction = defineAction(
  async (input: BaseRegisterInput, deps: BaseRegisterDeps): Promise<Identity> => {
    const passwordHash = await HashPasswordTask(input.password);
    return deps.identityRepo.create({ email: input.email, passwordHash });
  },
);
