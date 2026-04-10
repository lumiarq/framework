/**
 * Crypto utilities for @illumiarq/core.
 * Uses argon2id for passwords.
 */
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

/**
 * Hashes a plain-text password using argon2id.
 * Always produces a different hash for the same input (salted).
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/**
 * Verifies a plain-text password against an argon2id hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

/**
 * Generates a cryptographically secure random hex token.
 * Default: 32 bytes → 64 hex characters.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
