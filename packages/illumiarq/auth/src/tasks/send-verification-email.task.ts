import { defineTask, generateToken } from '@illumiarq/core';
import { createHash } from 'node:crypto';

export interface SendVerificationEmailInput {
  identityId: string;
  email: string;
}

export interface SendVerificationEmailResult {
  /** Raw verification token — send via email. */
  token: string;
  /** SHA-256 hash of the raw token — store this, never the raw value. */
  tokenHash: string;
}

/**
 * Generates a secure email verification token (raw + SHA-256 hash).
 * The caller is responsible for storing the hash and sending the raw token via email.
 */
export const SendVerificationEmailTask = defineTask(
  async (_input: SendVerificationEmailInput): Promise<SendVerificationEmailResult> => {
    const token = generateToken(32);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  },
);
