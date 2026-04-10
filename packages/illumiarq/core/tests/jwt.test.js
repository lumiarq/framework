import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { sign, verify } from '../src/index.js';
// Generate a fresh RS256 key pair for each test run
let privateKey;
let publicKey;
beforeAll(() => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
});
describe('sign', () => {
  it('returns a JWT string (three dot-separated parts)', async () => {
    const token = await sign({ sub: 'user-1' }, privateKey);
    expect(token.split('.')).toHaveLength(3);
  });
  it('encodes the payload claims into the token', async () => {
    const token = await sign({ sub: 'user-42', role: 'admin' }, privateKey);
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload.sub).toBe('user-42');
    expect(payload.role).toBe('admin');
  });
  it('uses RS256 as the algorithm (header alg claim)', async () => {
    const token = await sign({ sub: 'user-1' }, privateKey);
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    expect(header.alg).toBe('RS256');
  });
  it('accepts an expiresIn option', async () => {
    const token = await sign({ sub: 'user-1' }, privateKey, { expiresIn: '1h' });
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    expect(payload.exp).toBeDefined();
    expect(typeof payload.exp).toBe('number');
  });
});
describe('verify', () => {
  it('returns the decoded payload for a valid token', async () => {
    const token = await sign({ sub: 'user-7' }, privateKey);
    const payload = await verify(token, publicKey);
    expect(payload.sub).toBe('user-7');
  });
  it('throws for a tampered token', async () => {
    const token = await sign({ sub: 'user-1' }, privateKey);
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: 'hacker' })).toString('base64url');
    const tampered = parts.join('.');
    await expect(verify(tampered, publicKey)).rejects.toThrow();
  });
  it('throws for a wrong public key', async () => {
    const other = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const token = await sign({ sub: 'user-1' }, privateKey);
    await expect(verify(token, other.publicKey)).rejects.toThrow();
  });
  it('throws for an expired token', async () => {
    // Sign with a negative expiresIn — already expired
    const token = await sign({ sub: 'user-1' }, privateKey, { expiresIn: '-1s' });
    await expect(verify(token, publicKey)).rejects.toThrow();
  });
});
//# sourceMappingURL=jwt.test.js.map
