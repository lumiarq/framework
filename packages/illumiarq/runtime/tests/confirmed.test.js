import { describe, it, expect, beforeEach } from 'vitest';
import { confirmedMiddleware, writeConfirmedAt } from '../src/middleware/confirmed.js';
import { InMemorySessionStore } from '../src/session/store.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const SESSION_ID = 'confirmed-test-session-001';
function makeStore() {
  return new InMemorySessionStore();
}
function makeReq(options = {}) {
  return new Request(options.url ?? 'http://localhost/account/settings', {
    headers: { 'x-session-id': SESSION_ID, ...options.headers },
  });
}
const handler = async () => new Response('ok', { status: 200 });
// ─── confirmedMiddleware ──────────────────────────────────────────────────────
describe('confirmedMiddleware', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  // ── No session ─────────────────────────────────────────────────────────────
  describe('no session header or cookie', () => {
    it('returns 302 redirect to /confirm-password for web requests', async () => {
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = new Request('http://localhost/account/settings'); // no x-session-id
      const res = await mw(req, handler);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/confirm-password');
    });
    it('returns 423 JSON for API requests when no session', async () => {
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = new Request('http://localhost/api/account/settings');
      const res = await mw(req, handler);
      expect(res.status).toBe(423);
      const body = await res.json();
      expect(body.message).toBe('Password confirmation required.');
    });
  });
  // ── Not confirmed ──────────────────────────────────────────────────────────
  describe('session exists but __confirmed_at is absent', () => {
    it('returns 302 for web request', async () => {
      await store.set(SESSION_ID, { userId: 1 }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/confirm-password');
    });
    it('returns 423 for API request', async () => {
      await store.set(SESSION_ID, { userId: 1 }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = makeReq({ url: 'http://localhost/api/account' });
      const res = await mw(req, handler);
      expect(res.status).toBe(423);
    });
  });
  // ── Window expired ─────────────────────────────────────────────────────────
  describe('confirmation window expired', () => {
    it('returns 302 when __confirmed_at is older than window', async () => {
      const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago
      await store.set(SESSION_ID, { __confirmed_at: fourHoursAgo }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store }); // default window = 3h
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(302);
    });
    it('returns 423 for API request when window expired', async () => {
      const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
      await store.set(SESSION_ID, { __confirmed_at: fourHoursAgo }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = makeReq({ url: 'http://localhost/api/account' });
      const res = await mw(req, handler);
      expect(res.status).toBe(423);
      const body = await res.json();
      expect(body.message).toBe('Password confirmation required.');
    });
  });
  // ── Valid confirmation ─────────────────────────────────────────────────────
  describe('confirmation valid within window', () => {
    it('calls next() and returns 200', async () => {
      await store.set(SESSION_ID, { __confirmed_at: Date.now() }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(200);
    });
    it('passes through for API requests when confirmed', async () => {
      await store.set(SESSION_ID, { __confirmed_at: Date.now() }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = makeReq({ url: 'http://localhost/api/account' });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  // ── Custom window ──────────────────────────────────────────────────────────
  describe('custom window option', () => {
    it('respects a custom window (5 minutes)', async () => {
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      await store.set(SESSION_ID, { __confirmed_at: sixMinutesAgo }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store, window: 300 }); // 5 min
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(302);
    });
    it('passes within custom window', async () => {
      const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
      await store.set(SESSION_ID, { __confirmed_at: threeMinutesAgo }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store, window: 300 }); // 5 min
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(200);
    });
  });
  // ── Custom options ─────────────────────────────────────────────────────────
  describe('custom redirectTo option', () => {
    it('redirects to custom path when not confirmed', async () => {
      await store.set(SESSION_ID, {}, 3600);
      const mw = confirmedMiddleware({ sessionStore: store, redirectTo: '/auth/re-confirm' });
      const res = await mw(makeReq(), handler);
      expect(res.headers.get('Location')).toBe('/auth/re-confirm');
    });
  });
  describe('custom apiPrefix option', () => {
    it('treats routes with custom prefix as API routes', async () => {
      await store.set(SESSION_ID, {}, 3600);
      const mw = confirmedMiddleware({ sessionStore: store, apiPrefix: '/v2/' });
      const req = makeReq({ url: 'http://localhost/v2/account' });
      const res = await mw(req, handler);
      expect(res.status).toBe(423);
    });
  });
  describe('session resolved from cookie', () => {
    it('reads session from lumiarq_session cookie', async () => {
      await store.set(SESSION_ID, { __confirmed_at: Date.now() }, 3600);
      const mw = confirmedMiddleware({ sessionStore: store });
      const req = new Request('http://localhost/account', {
        headers: { cookie: `lumiarq_session=${SESSION_ID}` },
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
});
// ─── writeConfirmedAt ─────────────────────────────────────────────────────────
describe('writeConfirmedAt', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  it('writes __confirmed_at timestamp to the session', async () => {
    await store.set(SESSION_ID, { userId: 5 }, 3600);
    const before = Date.now();
    await writeConfirmedAt(SESSION_ID, store);
    const after = Date.now();
    const session = await store.get(SESSION_ID);
    const confirmedAt = session?.['__confirmed_at'];
    expect(typeof confirmedAt).toBe('number');
    expect(confirmedAt).toBeGreaterThanOrEqual(before);
    expect(confirmedAt).toBeLessThanOrEqual(after);
  });
  it('preserves existing session data', async () => {
    await store.set(SESSION_ID, { userId: 42, role: 'admin' }, 3600);
    await writeConfirmedAt(SESSION_ID, store);
    const session = await store.get(SESSION_ID);
    expect(session?.['userId']).toBe(42);
    expect(session?.['role']).toBe('admin');
  });
  it('creates the session when none exists', async () => {
    await writeConfirmedAt(SESSION_ID, store);
    const session = await store.get(SESSION_ID);
    expect(session).not.toBeNull();
    expect(typeof session?.['__confirmed_at']).toBe('number');
  });
  it('allows confirmedMiddleware to pass after writeConfirmedAt', async () => {
    await store.set(SESSION_ID, {}, 3600);
    await writeConfirmedAt(SESSION_ID, store);
    const mw = confirmedMiddleware({ sessionStore: store });
    const res = await mw(makeReq(), handler);
    expect(res.status).toBe(200);
  });
});
//# sourceMappingURL=confirmed.test.js.map
