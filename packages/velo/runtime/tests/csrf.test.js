import { describe, it, expect, beforeEach } from 'vitest';
import { csrfMiddleware } from '../src/middleware/csrf.js';
import { InMemorySessionStore } from '../src/session/store.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const SESSION_KEY = '_csrf_token';
const SESSION_ID = 'test-session-abc123';
const VALID_TOKEN = 'a'.repeat(64); // 64 hex chars = 32 random bytes
function makeStore() {
  return new InMemorySessionStore();
}
function makeReq(options = {}) {
  const {
    method = 'GET',
    url = 'http://localhost/dashboard',
    headers = {},
    body,
    contentType,
  } = options;
  const reqHeaders = {
    'x-session-id': SESSION_ID,
    ...headers,
  };
  if (contentType) reqHeaders['content-type'] = contentType;
  if (!reqHeaders['content-type'] && body) reqHeaders['content-type'] = 'application/json';
  return new Request(url, {
    method,
    headers: reqHeaders,
    ...(body !== undefined && { body }),
  });
}
const handler = async () => new Response('ok', { status: 200 });
// ─── csrfMiddleware ───────────────────────────────────────────────────────────
describe('csrfMiddleware', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });
  // ── Safe methods (GET/HEAD/OPTIONS) ────────────────────────────────────────
  describe('GET request', () => {
    it('generates and stores a CSRF token, sets X-CSRF-Token response header', async () => {
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq();
      const res = await mw(req, handler);
      const token = res.headers.get('X-CSRF-Token');
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
    it('returns the same token on subsequent GET (token re-used from session)', async () => {
      const mw = csrfMiddleware({ sessionStore: store });
      // Pre-seed the session with a known token.
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const res = await mw(makeReq(), handler);
      const token = res.headers.get('X-CSRF-Token');
      expect(token).toBe(VALID_TOKEN);
    });
    it('passes through the handler response', async () => {
      const mw = csrfMiddleware({ sessionStore: store });
      const res = await mw(makeReq(), handler);
      expect(res.status).toBe(200);
    });
  });
  // ── Mutation methods (POST/PUT/PATCH/DELETE) ───────────────────────────────
  describe('POST with valid token in X-CSRF-TOKEN header', () => {
    it('passes through to handler', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        headers: { 'x-csrf-token': VALID_TOKEN },
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  describe('POST with valid token in body (_token field)', () => {
    it('passes through to handler when JSON body contains _token', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        body: JSON.stringify({ _token: VALID_TOKEN, name: 'Alice' }),
        contentType: 'application/json',
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
    it('passes through to handler when urlencoded body contains _token', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        body: `_token=${VALID_TOKEN}&name=Alice`,
        contentType: 'application/x-www-form-urlencoded',
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
    it('passes through to handler when multipart body contains _token', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const form = new FormData();
      form.set('_token', VALID_TOKEN);
      form.set('name', 'Alice');
      const req = new Request('http://localhost/dashboard', {
        method: 'POST',
        headers: { 'x-session-id': SESSION_ID },
        body: form,
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  describe('POST with missing token', () => {
    it('returns 419', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({ method: 'POST' });
      const res = await mw(req, handler);
      expect(res.status).toBe(419);
    });
    it('returns JSON body with message', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({ method: 'POST' });
      const res = await mw(req, handler);
      const body = await res.json();
      expect(body.message).toBe('CSRF token mismatch.');
    });
  });
  describe('POST with invalid (wrong) token', () => {
    it('returns 419', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        headers: { 'x-csrf-token': 'b'.repeat(64) }, // wrong token
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(419);
    });
  });
  // ── Exclusions ─────────────────────────────────────────────────────────────
  describe('POST to /api/ route (default excludePrefix)', () => {
    it('skips CSRF check — passes through without 419', async () => {
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        url: 'http://localhost/api/users',
        // No token provided — should still pass.
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  describe('Request with X-Skip-CSRF: 1 header', () => {
    it('skips CSRF check entirely', async () => {
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'POST',
        headers: { 'x-skip-csrf': '1' },
        // No token.
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  describe('custom excludePrefix', () => {
    it('skips CSRF for routes matching the custom prefix', async () => {
      const mw = csrfMiddleware({ sessionStore: store, excludePrefix: '/webhook/' });
      const req = makeReq({
        method: 'POST',
        url: 'http://localhost/webhook/stripe',
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
  describe('DELETE with valid header token', () => {
    it('passes through to handler', async () => {
      await store.set(SESSION_ID, { [SESSION_KEY]: VALID_TOKEN }, 3600);
      const mw = csrfMiddleware({ sessionStore: store });
      const req = makeReq({
        method: 'DELETE',
        headers: { 'x-csrf-token': VALID_TOKEN },
      });
      const res = await mw(req, handler);
      expect(res.status).toBe(200);
    });
  });
});
//# sourceMappingURL=csrf.test.js.map
