import { describe, it, expect, beforeEach } from 'vitest';
import { writeFlash, writeOld, readAndClearFlash, getOld } from '../src/helpers/flash.js';
import { flashMiddleware } from '../src/middleware/flash.js';
import { InMemorySessionStore } from '../src/session/store.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const SESSION_ID = 'flash-test-session-001';
function makeStore() {
  return new InMemorySessionStore();
}
function makeReq(headers = {}) {
  return new Request('http://localhost/dashboard', { headers });
}
const handler = async () => new Response('ok', { status: 200 });
// ─── writeFlash ───────────────────────────────────────────────────────────────
describe('writeFlash', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  it('stores the value under __flash[key] in the session', async () => {
    await store.set(SESSION_ID, {}, 3600);
    await writeFlash(SESSION_ID, store, 'status', 'Saved!');
    const session = await store.get(SESSION_ID);
    const flash = session?.['__flash'];
    expect(flash).toBeDefined();
    expect(flash['status']).toBe('Saved!');
  });
  it('merges multiple keys into __flash', async () => {
    await store.set(SESSION_ID, {}, 3600);
    await writeFlash(SESSION_ID, store, 'status', 'Saved!');
    await writeFlash(SESSION_ID, store, 'error', 'Something went wrong');
    const session = await store.get(SESSION_ID);
    const flash = session?.['__flash'];
    expect(flash['status']).toBe('Saved!');
    expect(flash['error']).toBe('Something went wrong');
  });
  it('creates the session record when none exists', async () => {
    // No prior store.set call — writeFlash should create the entry.
    await writeFlash(SESSION_ID, store, 'status', 'Created');
    const session = await store.get(SESSION_ID);
    expect(session).not.toBeNull();
    const flash = session?.['__flash'];
    expect(flash['status']).toBe('Created');
  });
  it('preserves existing non-flash session data', async () => {
    await store.set(SESSION_ID, { userId: 42 }, 3600);
    await writeFlash(SESSION_ID, store, 'status', 'Done');
    const session = await store.get(SESSION_ID);
    expect(session?.['userId']).toBe(42);
  });
});
// ─── writeOld ────────────────────────────────────────────────────────────────
describe('writeOld', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  it('stores the DTO under __flash.__old', async () => {
    await store.set(SESSION_ID, {}, 3600);
    await writeOld(SESSION_ID, store, { email: 'alice@example.com', name: 'Alice' });
    const session = await store.get(SESSION_ID);
    const flash = session?.['__flash'];
    const old = flash?.['__old'];
    expect(old['email']).toBe('alice@example.com');
    expect(old['name']).toBe('Alice');
  });
  it('coexists with other flash keys', async () => {
    await store.set(SESSION_ID, {}, 3600);
    await writeFlash(SESSION_ID, store, 'error', 'Invalid form');
    await writeOld(SESSION_ID, store, { email: 'bob@example.com' });
    const session = await store.get(SESSION_ID);
    const flash = session?.['__flash'];
    expect(flash['error']).toBe('Invalid form');
    const old = flash['__old'];
    expect(old['email']).toBe('bob@example.com');
  });
});
// ─── readAndClearFlash ────────────────────────────────────────────────────────
describe('readAndClearFlash', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  it('reads flash keys and returns them', async () => {
    await store.set(
      SESSION_ID,
      {
        __flash: { status: 'Saved!', error: 'Oops' },
      },
      3600,
    );
    const { flash } = await readAndClearFlash(SESSION_ID, store);
    expect(flash['status']).toBe('Saved!');
    expect(flash['error']).toBe('Oops');
  });
  it('returns old input from __flash.__old', async () => {
    await store.set(
      SESSION_ID,
      {
        __flash: { __old: { email: 'alice@example.com' } },
      },
      3600,
    );
    const { old } = await readAndClearFlash(SESSION_ID, store);
    expect(old['email']).toBe('alice@example.com');
  });
  it('removes __flash from the session after reading', async () => {
    await store.set(
      SESSION_ID,
      {
        __flash: { status: 'Hello' },
      },
      3600,
    );
    await readAndClearFlash(SESSION_ID, store);
    const session = await store.get(SESSION_ID);
    expect(session?.['__flash']).toBeUndefined();
  });
  it('returns empty flash and old on second call (consumed)', async () => {
    await store.set(
      SESSION_ID,
      {
        __flash: { status: 'Once' },
      },
      3600,
    );
    await readAndClearFlash(SESSION_ID, store); // first read
    const second = await readAndClearFlash(SESSION_ID, store); // second read
    expect(second.flash).toEqual({});
    expect(second.old).toEqual({});
  });
  it('returns empty objects when session has no __flash', async () => {
    await store.set(SESSION_ID, { userId: 7 }, 3600);
    const { flash, old } = await readAndClearFlash(SESSION_ID, store);
    expect(flash).toEqual({});
    expect(old).toEqual({});
  });
  it('returns empty objects when session does not exist', async () => {
    const { flash, old } = await readAndClearFlash('nonexistent-session', store);
    expect(flash).toEqual({});
    expect(old).toEqual({});
  });
});
// ─── getOld ──────────────────────────────────────────────────────────────────
describe('getOld', () => {
  it('returns the string value for a known key', () => {
    const old = { email: 'user@example.com', age: 30 };
    expect(getOld(old, 'email')).toBe('user@example.com');
  });
  it('returns undefined for a missing key', () => {
    expect(getOld({}, 'email')).toBeUndefined();
  });
  it('returns undefined for non-string values', () => {
    const old = { age: 30 };
    expect(getOld(old, 'age')).toBeUndefined();
  });
});
// ─── flashMiddleware ──────────────────────────────────────────────────────────
describe('flashMiddleware', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  it('reads __flash, clears session, and sets x-flash-data header on response', async () => {
    await store.set(
      SESSION_ID,
      {
        __flash: { status: 'Welcome back!', __old: { email: 'a@b.com' } },
      },
      3600,
    );
    const mw = flashMiddleware({ sessionStore: store });
    const req = makeReq({ 'x-session-id': SESSION_ID });
    const res = await mw(req, handler);
    const raw = res.headers.get('x-flash-data');
    expect(raw).toBeTruthy();
    const payload = JSON.parse(Buffer.from(raw, 'base64').toString());
    expect(payload.flash['status']).toBe('Welcome back!');
    expect(payload.old['email']).toBe('a@b.com');
  });
  it('clears __flash from session so second request sees nothing', async () => {
    await store.set(SESSION_ID, { __flash: { status: 'Once' } }, 3600);
    const mw = flashMiddleware({ sessionStore: store });
    const req = makeReq({ 'x-session-id': SESSION_ID });
    await mw(req, handler); // first request — consumes flash
    const session = await store.get(SESSION_ID);
    expect(session?.['__flash']).toBeUndefined();
  });
  it('does NOT set x-flash-data header when no session is found', async () => {
    const mw = flashMiddleware({ sessionStore: store });
    const req = makeReq(); // no x-session-id, no cookie
    const res = await mw(req, handler);
    expect(res.headers.get('x-flash-data')).toBeNull();
  });
  it('sets x-flash-data with empty flash when __flash is absent', async () => {
    await store.set(SESSION_ID, { userId: 99 }, 3600);
    const mw = flashMiddleware({ sessionStore: store });
    const req = makeReq({ 'x-session-id': SESSION_ID });
    const res = await mw(req, handler);
    const raw = res.headers.get('x-flash-data');
    expect(raw).toBeTruthy();
    const payload = JSON.parse(Buffer.from(raw, 'base64').toString());
    expect(payload.flash).toEqual({});
    expect(payload.old).toEqual({});
  });
  it('resolves session ID from lumiarq_session cookie', async () => {
    await store.set(SESSION_ID, { __flash: { status: 'Cookie!' } }, 3600);
    const mw = flashMiddleware({ sessionStore: store });
    const req = makeReq({ cookie: `lumiarq_session=${SESSION_ID}` });
    const res = await mw(req, handler);
    const raw = res.headers.get('x-flash-data');
    expect(raw).toBeTruthy();
    const payload = JSON.parse(Buffer.from(raw, 'base64').toString());
    expect(payload.flash['status']).toBe('Cookie!');
  });
});
//# sourceMappingURL=flash.test.js.map
