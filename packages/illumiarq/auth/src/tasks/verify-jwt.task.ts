import { defineTask, verify } from '@illumiarq/core';

export interface VerifyJwtInput {
  token: string;
  publicKey: string;
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws if the token is invalid, expired, or signed with the wrong key.
 */
export const VerifyJwtTask = defineTask(
  async ({ token, publicKey }: VerifyJwtInput): Promise<Record<string, unknown>> =>
    verify(token, publicKey),
);
