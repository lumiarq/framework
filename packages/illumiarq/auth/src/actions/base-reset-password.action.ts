import { defineAction } from '@illumiarq/core';
import type { IIdentityRepository } from '../contracts/identity-repository.js';
import { HashPasswordTask } from '../tasks/hash-password.task.js';

export interface BaseResetPasswordInput {
  userId: string;
  newPassword: string;
}

export interface BaseResetPasswordDeps {
  identityRepo: IIdentityRepository;
}

/**
 * Base reset-password action.
 * Hashes the new password and updates the identity record.
 * Token validation is caller's responsibility (application layer).
 */
export const BaseResetPasswordAction = defineAction(
  async (input: BaseResetPasswordInput, deps: BaseResetPasswordDeps): Promise<void> => {
    const passwordHash = await HashPasswordTask(input.newPassword);
    await deps.identityRepo.updatePassword(input.userId, passwordHash);
  },
);
