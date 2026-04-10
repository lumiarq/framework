import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import {
  HashPasswordTask,
  VerifyPasswordTask,
  IssueJwtTask,
  VerifyJwtTask,
  CreateSessionTask,
  RevokeSessionTask,
} from '../src/index.js';
import type { ISessionRepository, Session, CreateSessionData } from '../src/index.js';

// ─── Test RSA keys ────────────────────────────────────────────────────────────
let privateKey: string;
let publicKey: string;

beforeAll(() => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
});

// ─── In-memory session repo for task tests ────────────────────────────────────
function makeSessionRepo(): ISessionRepository & { store: Session[] } {
  const store: Session[] = [];
  return {
    store,
    async create(data: CreateSessionData): Promise<Session> {
      const s: Session = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
      store.push(s);
      return s;
    },
    async findByToken(tokenHash: string): Promise<Session | null> {
      return store.find((s) => s.tokenHash === tokenHash) ?? null;
    },
    async revoke(sessionId: string): Promise<void> {
      const idx = store.findIndex((s) => s.id === sessionId);
      if (idx !== -1) store.splice(idx, 1);
    },
    async revokeAllForUser(userId: string): Promise<void> {
      const toRemove = store.filter((s) => s.userId === userId);
      toRemove.forEach((s) => {
        const i = store.indexOf(s);
        if (i !== -1) store.splice(i, 1);
      });
    },
  };
}

// ─── HashPasswordTask ─────────────────────────────────────────────────────────

describe('HashPasswordTask', () => {
  it('returns an argon2id hash string', async () => {
    const hash = await HashPasswordTask('my-password');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('produces different hashes for the same input (salted)', async () => {
    const h1 = await HashPasswordTask('same-password');
    const h2 = await HashPasswordTask('same-password');
    expect(h1).not.toBe(h2);
  });
});

// ─── VerifyPasswordTask ───────────────────────────────────────────────────────

describe('VerifyPasswordTask', () => {
  it('returns true for a correct password', async () => {
    const hash = await HashPasswordTask('hunter2');
    expect(await VerifyPasswordTask({ plain: 'hunter2', hash })).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const hash = await HashPasswordTask('hunter2');
    expect(await VerifyPasswordTask({ plain: 'wrong', hash })).toBe(false);
  });
});

// ─── IssueJwtTask ─────────────────────────────────────────────────────────────

describe('IssueJwtTask', () => {
  it('issues a JWT with three parts', async () => {
    const token = await IssueJwtTask({ payload: { sub: 'u1' }, privateKey });
    expect(token.split('.')).toHaveLength(3);
  });

  it('JWT header declares RS256', async () => {
    const token = await IssueJwtTask({ payload: { sub: 'u1' }, privateKey });
    const header = JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString());
    expect(header.alg).toBe('RS256');
  });

  it('supports expiresIn option', async () => {
    const token = await IssueJwtTask({
      payload: { sub: 'u1' },
      privateKey,
      opts: { expiresIn: '1h' },
    });
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(payload.exp).toBeDefined();
  });
});

// ─── VerifyJwtTask ────────────────────────────────────────────────────────────

describe('VerifyJwtTask', () => {
  it('returns decoded payload for a valid token', async () => {
    const token = await IssueJwtTask({ payload: { sub: 'u-42' }, privateKey });
    const payload = await VerifyJwtTask({ token, publicKey });
    expect(payload.sub).toBe('u-42');
  });

  it('throws for a tampered token', async () => {
    const token = await IssueJwtTask({ payload: { sub: 'u1' }, privateKey });
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: 'hacker' })).toString('base64url');
    await expect(VerifyJwtTask({ token: parts.join('.'), publicKey })).rejects.toThrow();
  });
});

// ─── CreateSessionTask ────────────────────────────────────────────────────────

describe('CreateSessionTask', () => {
  it('creates a session record in the repo', async () => {
    const repo = makeSessionRepo();
    const data = { userId: 'u1', tokenHash: 'abc123', expiresAt: new Date(Date.now() + 1000) };
    const session = await CreateSessionTask(data, repo);
    expect(session.id).toBeDefined();
    expect(session.userId).toBe('u1');
    expect(session.tokenHash).toBe('abc123');
    expect(repo.store).toHaveLength(1);
  });
});

// ─── RevokeSessionTask ────────────────────────────────────────────────────────

describe('RevokeSessionTask', () => {
  it('removes the session from the repo', async () => {
    const repo = makeSessionRepo();
    const data = { userId: 'u1', tokenHash: 'xyz', expiresAt: new Date(Date.now() + 1000) };
    const session = await CreateSessionTask(data, repo);
    expect(repo.store).toHaveLength(1);

    await RevokeSessionTask(session.id, repo);
    expect(repo.store).toHaveLength(0);
  });
});
