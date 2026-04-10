import { defineAction } from '@velo/core';
import type { IIdentityRepository } from '../contracts/identity-repository.js';
import { SendVerificationEmailTask } from '../tasks/send-verification-email.task.js';

export interface BaseResendVerificationEmailInput {
  identityId: string;
  email: string;
}

export interface BaseResendVerificationEmailDeps {
  identityRepo: IIdentityRepository;
  /**
   * Callback invoked with the generated raw token and its hash.
   * The application is responsible for storing the hash and sending the raw token via email.
   */
  onTokenGenerated: (data: {
    identityId: string;
    email: string;
    token: string;
    tokenHash: string;
  }) => Promise<void>;
}

/**
 * Base resend-verification-email action.
 * Generates a new email verification token (raw + SHA-256 hash) and delegates
 * storage and email delivery to the onTokenGenerated callback.
 * Application code wraps this action to wire in the mailer and repository update.
 */
export const BaseResendVerificationEmailAction = defineAction(
  async (
    input: BaseResendVerificationEmailInput,
    deps: BaseResendVerificationEmailDeps,
  ): Promise<void> => {
    const { token, tokenHash } = await SendVerificationEmailTask({
      identityId: input.identityId,
      email: input.email,
    });
    await deps.onTokenGenerated({
      identityId: input.identityId,
      email: input.email,
      token,
      tokenHash,
    });
  },
);
