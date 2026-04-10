/**
 * Crypto utilities for @velo/core.
 * Uses argon2id for passwords.
 */
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
/**
 * Hashes a plain-text password using argon2id.
 * Always produces a different hash for the same input (salted).
 */
export async function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id });
}
/**
 * Verifies a plain-text password against an argon2id hash.
 */
export async function verifyPassword(plain, hash) {
  return argon2.verify(hash, plain);
}
/**
 * Generates a cryptographically secure random hex token.
 * Default: 32 bytes → 64 hex characters.
 */
export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}
//# sourceMappingURL=index.js.map
