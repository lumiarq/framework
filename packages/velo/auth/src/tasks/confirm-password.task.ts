import { defineTask } from '@velo/core';

export interface ConfirmPasswordInput {
  identityId: string;
}

export interface ConfirmPasswordResult {
  /** Timestamp at which the user confirmed their password. */
  confirmedAt: Date;
}

/**
 * Records that the user has confirmed their password.
 * Returns the confirmation timestamp; the caller is responsible for persisting it.
 */
export const ConfirmPasswordTask = defineTask(
  async (_input: ConfirmPasswordInput): Promise<ConfirmPasswordResult> => ({
    confirmedAt: new Date(),
  }),
);
