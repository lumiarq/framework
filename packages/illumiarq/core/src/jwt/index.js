/**
 * JWT utilities for @velo/core.
 * RS256 only — never HS256.
 * Uses `jose` which works in Node.js and Cloudflare Workers.
 */
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
/**
 * Signs a payload as a JWT using RS256.
 * @param payload    - Claims to include in the token.
 * @param privateKey - PEM-encoded PKCS#8 RSA private key.
 * @param opts       - Optional settings (expiresIn).
 */
export async function sign(payload, privateKey, opts = {}) {
  const key = await importPKCS8(privateKey, 'RS256');
  let builder = new SignJWT(payload).setProtectedHeader({ alg: 'RS256' });
  if (opts.expiresIn !== undefined) {
    builder = builder.setExpirationTime(opts.expiresIn);
  }
  return builder.sign(key);
}
/**
 * Verifies a JWT and returns the decoded payload.
 * Throws if the token is invalid, expired, or signed with the wrong key.
 * @param token     - The JWT string to verify.
 * @param publicKey - PEM-encoded SPKI RSA public key.
 */
export async function verify(token, publicKey) {
  const key = await importSPKI(publicKey, 'RS256');
  const { payload } = await jwtVerify(token, key, { algorithms: ['RS256'] });
  return payload;
}
//# sourceMappingURL=index.js.map
