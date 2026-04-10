import { defineAction } from '@velo/core';
import type { IIdentityRepository } from '../contracts/identity-repository.js';
import type { ConfirmPasswordResponse } from '../contracts/responses.js';
import { VerifyPasswordTask } from '../tasks/verify-password.task.js';
import { ConfirmPasswordTask } from '../tasks/confirm-password.task.js';

export interface BaseConfirmPasswordInput {
  identityId: string;
  password: string;
}

export interface BaseConfirmPasswordDeps {
  identityRepo: IIdentityRepository;
}

/**
 * Base confirm-password action.
 * Verifies the user's current password and records the confirmation timestamp.
 * Application code wraps this action to persist passwordConfirmedAt.
 */
export const BaseConfirmPasswordAction = defineAction(
  async (
    input: BaseConfirmPasswordInput,
    deps: BaseConfirmPasswordDeps,
  ): Promise<ConfirmPasswordResponse> => {
    const identity = await deps.identityRepo.findById(input.identityId);
    if (!identity) return { confirmed: false };

    const valid = await VerifyPasswordTask({ plain: input.password, hash: identity.passwordHash });
    if (!valid) return { confirmed: false };

    await ConfirmPasswordTask({ identityId: input.identityId });
    return { confirmed: true };
  },
);
