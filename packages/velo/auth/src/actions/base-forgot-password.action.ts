import { defineAction, generateToken } from '@velo/core';
import { createHash } from 'node:crypto';
import type { IIdentityRepository } from '../contracts/identity-repository.js';

export interface BaseForgotPasswordInput {
  email: string;
}

export interface BaseForgotPasswordDeps {
  identityRepo: IIdentityRepository;
}

export interface BaseForgotPasswordResult {
  /** Whether an identity with this email exists (used for timing-safe response) */
  found: boolean;
  /** Raw reset token — send via email. */
  token: string;
  /** SHA-256 hash of the raw token — store this, never the raw value. */
  tokenHash: string;
}

/**
 * Base forgot-password action.
 * Generates a password reset token (raw + hash).
 * The caller is responsible for storing the hash and sending the raw token via email.
 */
export const BaseForgotPasswordAction = defineAction(
  async (
    input: BaseForgotPasswordInput,
    deps: BaseForgotPasswordDeps,
  ): Promise<BaseForgotPasswordResult> => {
    const identity = await deps.identityRepo.findByEmail(input.email);
    const token = generateToken(32);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return { found: !!identity, token, tokenHash };
  },
);
