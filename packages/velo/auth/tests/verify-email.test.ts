import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { VerifyEmailTokenTask, SendVerificationEmailTask } from '../src/index.js';

// ─── SendVerificationEmailTask ────────────────────────────────────────────────

describe('SendVerificationEmailTask', () => {
  it('returns a token and tokenHash pair', async () => {
    const result = await SendVerificationEmailTask({
      identityId: 'u1',
      email: 'user@example.com',
    });
    expect(result.token).toBeDefined();
    expect(result.tokenHash).toBeDefined();
    expect(result.token).not.toBe(result.tokenHash);
  });

  it('raw token hashes to the returned tokenHash', async () => {
    const { token, tokenHash } = await SendVerificationEmailTask({
      identityId: 'u1',
      email: 'user@example.com',
    });
    const computed = createHash('sha256').update(token).digest('hex');
    expect(computed).toBe(tokenHash);
  });
});

// ─── VerifyEmailTokenTask ─────────────────────────────────────────────────────

describe('VerifyEmailTokenTask', () => {
  it('returns true for a valid, non-expired token', async () => {
    const { token, tokenHash } = await SendVerificationEmailTask({
      identityId: 'u1',
      email: 'a@b.com',
    });
    const expiresAt = new Date(Date.now() + 60_000);
    const result = await VerifyEmailTokenTask({ token, tokenHash, expiresAt });
    expect(result).toBe(true);
  });

  it('returns false for an expired token', async () => {
    const { token, tokenHash } = await SendVerificationEmailTask({
      identityId: 'u1',
      email: 'a@b.com',
    });
    const expiresAt = new Date(Date.now() - 1); // already expired
    const result = await VerifyEmailTokenTask({ token, tokenHash, expiresAt });
    expect(result).toBe(false);
  });

  it('returns false for a hash mismatch', async () => {
    const { token } = await SendVerificationEmailTask({
      identityId: 'u1',
      email: 'a@b.com',
    });
    const wrongHash = createHash('sha256').update('different-raw-token').digest('hex');
    const expiresAt = new Date(Date.now() + 60_000);
    const result = await VerifyEmailTokenTask({ token, tokenHash: wrongHash, expiresAt });
    expect(result).toBe(false);
  });
});
