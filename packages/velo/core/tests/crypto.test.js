import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken } from '../src/index.js';
describe('hashPassword', () => {
  it('returns a string hash', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
  it('produces different hashes for the same password (argon2id uses salt)', async () => {
    const h1 = await hashPassword('secret123');
    const h2 = await hashPassword('secret123');
    expect(h1).not.toBe(h2);
  });
  it('argon2id hash starts with the $argon2id prefix', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).toMatch(/^\$argon2id\$/);
  });
});
describe('verifyPassword', () => {
  it('returns true for a matching password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('correct-horse', hash)).toBe(true);
  });
  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
describe('generateToken', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateToken()).toBe('string');
    expect(generateToken().length).toBeGreaterThan(0);
  });
  it('generates unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateToken()));
    expect(tokens.size).toBe(20);
  });
  it('produces a 64-character hex string by default', () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
  it('respects a custom byte length', () => {
    const token = generateToken(16);
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });
});
//# sourceMappingURL=crypto.test.js.map
