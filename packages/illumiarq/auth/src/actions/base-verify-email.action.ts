import { defineAction } from '@illumiarq/core';
import type { IIdentityRepository } from '../contracts/identity-repository.js';
import type { VerifyEmailResponse } from '../contracts/responses.js';
import { VerifyEmailTokenTask } from '../tasks/verify-email-token.task.js';

export interface BaseVerifyEmailInput {
  /** Raw verification token received from the email link. */
  token: string;
  identityId: string;
}

export interface BaseVerifyEmailDeps {
  identityRepo: IIdentityRepository;
  /** SHA-256 hash of the raw token as stored in the application's persistence layer. */
  tokenHash: string;
  /** Expiry timestamp for the verification token. */
  expiresAt: Date;
}

/**
 * Base email verification action.
 * Verifies a raw email verification token against the stored SHA-256 hash.
 *
 * The caller is responsible for fetching the stored tokenHash and expiresAt
 * from the application's persistence layer and passing them as deps.
 * Application code wraps this action to mark the identity as email-verified.
 */
export const BaseVerifyEmailAction = defineAction(
  async (input: BaseVerifyEmailInput, deps: BaseVerifyEmailDeps): Promise<VerifyEmailResponse> => {
    const verified = await VerifyEmailTokenTask({
      token: input.token,
      tokenHash: deps.tokenHash,
      expiresAt: deps.expiresAt,
    });
    return { verified };
  },
);
