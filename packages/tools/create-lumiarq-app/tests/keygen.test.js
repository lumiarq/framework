import { describe, it, expect } from 'vitest';
import { createSign, createVerify } from 'node:crypto';
import { generateRs256KeyPair, generateSessionSecret } from '../src/keygen.js';
describe('generateRs256KeyPair', () => {
  it('generates a valid RS256 key pair', () => {
    const { privateKey, publicKey } = generateRs256KeyPair();
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
  });
  it('the key pair can sign and verify', () => {
    const { privateKey, publicKey } = generateRs256KeyPair();
    const message = 'test-payload';
    const sign = createSign('SHA256');
    sign.update(message);
    const signature = sign.sign(privateKey);
    const verify = createVerify('SHA256');
    verify.update(message);
    expect(verify.verify(publicKey, signature)).toBe(true);
  });
  it('generates a new unique pair each call', () => {
    const pair1 = generateRs256KeyPair();
    const pair2 = generateRs256KeyPair();
    expect(pair1.privateKey).not.toBe(pair2.privateKey);
  });
});
describe('generateSessionSecret', () => {
  it('returns a hex string of at least 64 characters', () => {
    const secret = generateSessionSecret();
    expect(secret.length).toBeGreaterThanOrEqual(64);
    expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
  });
  it('generates unique secrets each call', () => {
    const s1 = generateSessionSecret();
    const s2 = generateSessionSecret();
    expect(s1).not.toBe(s2);
  });
});
//# sourceMappingURL=keygen.test.js.map
