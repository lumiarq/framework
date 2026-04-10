import { generateKeyPairSync, randomBytes } from 'node:crypto';

/** RS256 key pair for JWT signing. */
export interface Rs256KeyPair {
  /** PEM-encoded RSA private key (2048-bit) — store in .env only, never commit */
  privateKey: string;
  /** PEM-encoded RSA public key */
  publicKey: string;
}

/**
 * Generates an RS256 (RSA 2048-bit) key pair for JWT signing.
 * Private key: in .env only — never stdout, never .env.example, never committed.
 * Algorithm choice: RS256 over HS256 because asymmetric keys allow services to
 * verify tokens without sharing a secret.
 *
 * @returns RS256 key pair in PEM format
 */
export function generateRs256KeyPair(): Rs256KeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { privateKey, publicKey };
}

/**
 * Generates a cryptographically random session secret.
 * Must be ≥64 characters to provide sufficient entropy for HMAC-SHA256.
 *
 * @param length - Number of random bytes (hex-encoded, so output is 2× this length)
 * @returns Hex-encoded random string ≥64 characters
 */
export function generateSessionSecret(length = 32): string {
  // 32 bytes → 64 hex characters. Minimum required for HMAC-SHA256 security.
  return randomBytes(length).toString('hex');
}
