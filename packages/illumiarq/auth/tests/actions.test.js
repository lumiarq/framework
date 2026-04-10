import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import {
  BaseLoginAction,
  BaseRegisterAction,
  BaseLogoutAction,
  BaseForgotPasswordAction,
  BaseResetPasswordAction,
  HashPasswordTask,
  VerifyPasswordTask,
} from '../src/index.js';
// ─── Test RSA keys ────────────────────────────────────────────────────────────
let jwtPrivateKey;
beforeAll(() => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  jwtPrivateKey = pair.privateKey;
});
// ─── Mock repos ───────────────────────────────────────────────────────────────
function makeIdentityRepo(initial = []) {
  const store = [...initial];
  return {
    store,
    async findByEmail(email) {
      return store.find((i) => i.email === email) ?? null;
    },
    async findById(id) {
      return store.find((i) => i.id === id) ?? null;
    },
    async create(data) {
      const id = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      store.push(id);
      return id;
    },
    async updatePassword(id, passwordHash) {
      const identity = store.find((i) => i.id === id);
      if (identity) identity.passwordHash = passwordHash;
    },
  };
}
function makeSessionRepo(initial = []) {
  const store = [...initial];
  return {
    store,
    async create(data) {
      const s = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
      store.push(s);
      return s;
    },
    async findByToken(tokenHash) {
      return store.find((s) => s.tokenHash === tokenHash) ?? null;
    },
    async revoke(sessionId) {
      const idx = store.findIndex((s) => s.id === sessionId);
      if (idx !== -1) store.splice(idx, 1);
    },
    async revokeAllForUser(userId) {
      store.splice(0, store.length, ...store.filter((s) => s.userId !== userId));
    },
  };
}
// ─── BaseLoginAction ─────────────────────────────────────────────────────────
describe('BaseLoginAction', () => {
  let identityRepo;
  let sessionRepo;
  beforeEach(async () => {
    identityRepo = makeIdentityRepo();
    sessionRepo = makeSessionRepo();
    // Pre-register a user
    const hash = await HashPasswordTask('correct-password');
    await identityRepo.create({ email: 'user@example.com', passwordHash: hash });
  });
  it('returns jwt, token, identity, and session for valid credentials', async () => {
    const result = await BaseLoginAction(
      { email: 'user@example.com', password: 'correct-password' },
      { identityRepo, sessionRepo, jwtPrivateKey },
    );
    expect(result.jwt).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.identity.email).toBe('user@example.com');
    expect(result.session.id).toBeDefined();
  });
  it('creates a session record in the session repo', async () => {
    await BaseLoginAction(
      { email: 'user@example.com', password: 'correct-password' },
      { identityRepo, sessionRepo, jwtPrivateKey },
    );
    expect(sessionRepo.store).toHaveLength(1);
  });
  it('stores a tokenHash — not the raw token — in the session', async () => {
    const result = await BaseLoginAction(
      { email: 'user@example.com', password: 'correct-password' },
      { identityRepo, sessionRepo, jwtPrivateKey },
    );
    // The raw token must NOT equal the stored hash
    expect(sessionRepo.store[0].tokenHash).not.toBe(result.token);
    expect(sessionRepo.store[0].tokenHash.length).toBe(64); // sha-256 hex
  });
  it('throws AuthenticationError for unknown email', async () => {
    await expect(
      BaseLoginAction(
        { email: 'nobody@example.com', password: 'whatever' },
        { identityRepo, sessionRepo, jwtPrivateKey },
      ),
    ).rejects.toThrow('Unauthorized');
  });
  it('throws AuthenticationError for wrong password', async () => {
    await expect(
      BaseLoginAction(
        { email: 'user@example.com', password: 'wrong-password' },
        { identityRepo, sessionRepo, jwtPrivateKey },
      ),
    ).rejects.toThrow('Unauthorized');
  });
});
// ─── BaseRegisterAction ───────────────────────────────────────────────────────
describe('BaseRegisterAction', () => {
  it('creates an identity with a hashed password', async () => {
    const identityRepo = makeIdentityRepo();
    const identity = await BaseRegisterAction(
      { email: 'new@example.com', password: 'secret1234' },
      { identityRepo },
    );
    expect(identity.email).toBe('new@example.com');
    // Password must be hashed — not stored as plain text
    expect(identity.passwordHash).not.toBe('secret1234');
    expect(identity.passwordHash).toMatch(/^\$argon2id\$/);
  });
  it('persists the identity in the repo', async () => {
    const identityRepo = makeIdentityRepo();
    await BaseRegisterAction(
      { email: 'new@example.com', password: 'secret1234' },
      { identityRepo },
    );
    expect(identityRepo.store).toHaveLength(1);
  });
  it('does NOT create a session (login action handles that)', async () => {
    const identityRepo = makeIdentityRepo();
    const result = await BaseRegisterAction(
      { email: 'new@example.com', password: 'secret1234' },
      { identityRepo },
    );
    // Result is Identity only — no session or jwt fields
    expect(result.session).toBeUndefined();
    expect(result.jwt).toBeUndefined();
  });
});
// ─── BaseLogoutAction ─────────────────────────────────────────────────────────
describe('BaseLogoutAction', () => {
  it('revokes the session from the repo', async () => {
    const sessionRepo = makeSessionRepo();
    const session = await sessionRepo.create({
      userId: 'u1',
      tokenHash: 'hash',
      expiresAt: new Date(),
    });
    await BaseLogoutAction({ sessionId: session.id }, { sessionRepo });
    expect(sessionRepo.store).toHaveLength(0);
  });
});
// ─── BaseForgotPasswordAction ─────────────────────────────────────────────────
describe('BaseForgotPasswordAction', () => {
  it('returns found=true when identity exists', async () => {
    const identityRepo = makeIdentityRepo();
    await identityRepo.create({ email: 'known@example.com', passwordHash: 'x' });
    const result = await BaseForgotPasswordAction({ email: 'known@example.com' }, { identityRepo });
    expect(result.found).toBe(true);
  });
  it('returns found=false for unknown email (timing-safe response)', async () => {
    const identityRepo = makeIdentityRepo();
    const result = await BaseForgotPasswordAction(
      { email: 'unknown@example.com' },
      { identityRepo },
    );
    expect(result.found).toBe(false);
  });
  it('returns separate raw token and SHA-256 tokenHash — invariant 82', async () => {
    const identityRepo = makeIdentityRepo();
    const result = await BaseForgotPasswordAction({ email: 'any@example.com' }, { identityRepo });
    expect(result.token).toBeDefined();
    expect(result.tokenHash).toBeDefined();
    expect(result.token).not.toBe(result.tokenHash);
    expect(result.tokenHash.length).toBe(64); // sha-256 hex
  });
});
// ─── BaseResetPasswordAction ──────────────────────────────────────────────────
describe('BaseResetPasswordAction', () => {
  it('updates the identity password hash in the repo', async () => {
    const identityRepo = makeIdentityRepo();
    const identity = await identityRepo.create({
      email: 'u@example.com',
      passwordHash: 'old-hash',
    });
    await BaseResetPasswordAction(
      { userId: identity.id, newPassword: 'new-secure-password' },
      { identityRepo },
    );
    // Fetch updated identity
    const updated = await identityRepo.findById(identity.id);
    expect(updated.passwordHash).not.toBe('old-hash');
    expect(updated.passwordHash).toMatch(/^\$argon2id\$/);
  });
  it('new password verifies correctly after reset', async () => {
    const identityRepo = makeIdentityRepo();
    const identity = await identityRepo.create({ email: 'u@example.com', passwordHash: 'old' });
    await BaseResetPasswordAction(
      { userId: identity.id, newPassword: 'my-new-pass-123' },
      { identityRepo },
    );
    const updated = await identityRepo.findById(identity.id);
    expect(await VerifyPasswordTask({ plain: 'my-new-pass-123', hash: updated.passwordHash })).toBe(
      true,
    );
  });
});
//# sourceMappingURL=actions.test.js.map
