import { describe, it, expect } from 'vitest';
import { ConfirmPasswordTask, BaseConfirmPasswordAction, HashPasswordTask } from '../src/index.js';
import type { IIdentityRepository, Identity, CreateIdentityData } from '../src/index.js';

// ─── In-memory identity repo ──────────────────────────────────────────────────

function makeIdentityRepo(initial: Identity[] = []): IIdentityRepository & { store: Identity[] } {
  const store: Identity[] = [...initial];
  return {
    store,
    async findByEmail(email) {
      return store.find((i) => i.email === email) ?? null;
    },
    async findById(id) {
      return store.find((i) => i.id === id) ?? null;
    },
    async create(data: CreateIdentityData): Promise<Identity> {
      const id: Identity = {
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

// ─── ConfirmPasswordTask ──────────────────────────────────────────────────────

describe('ConfirmPasswordTask', () => {
  it('returns a confirmedAt Date', async () => {
    const result = await ConfirmPasswordTask({ identityId: 'u1' });
    expect(result.confirmedAt).toBeInstanceOf(Date);
  });
});

// ─── BaseConfirmPasswordAction ────────────────────────────────────────────────

describe('BaseConfirmPasswordAction', () => {
  it('returns { confirmed: true } on valid password', async () => {
    const identityRepo = makeIdentityRepo();
    const hash = await HashPasswordTask('secure-password-1');
    const identity = await identityRepo.create({ email: 'u@example.com', passwordHash: hash });

    const result = await BaseConfirmPasswordAction(
      { identityId: identity.id, password: 'secure-password-1' },
      { identityRepo },
    );
    expect(result.confirmed).toBe(true);
  });

  it('returns { confirmed: false } for a wrong password', async () => {
    const identityRepo = makeIdentityRepo();
    const hash = await HashPasswordTask('correct-password');
    const identity = await identityRepo.create({ email: 'u@example.com', passwordHash: hash });

    const result = await BaseConfirmPasswordAction(
      { identityId: identity.id, password: 'wrong-password' },
      { identityRepo },
    );
    expect(result.confirmed).toBe(false);
  });

  it('returns { confirmed: false } for an unknown identity', async () => {
    const identityRepo = makeIdentityRepo();

    const result = await BaseConfirmPasswordAction(
      { identityId: 'non-existent-id', password: 'any-password' },
      { identityRepo },
    );
    expect(result.confirmed).toBe(false);
  });
});
