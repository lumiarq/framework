import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  deriveCacheControl,
  withHeaders,
  securityHeadersMiddleware,
  requestIdMiddleware,
  cacheControlMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  composeMiddleware,
} from '../src/middleware-pipeline.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(method = 'GET', headers = {}) {
  return new Request('http://localhost/', { method, headers });
}
function ok(body = 'ok') {
  return new Response(body, { status: 200 });
}
const handler = async () => ok();
// ─── deriveCacheControl ────────────────────────────────────────────────────────
describe('deriveCacheControl', () => {
  it('dynamic render → no-store', () => {
    expect(deriveCacheControl({ render: 'dynamic' })).toBe('no-store');
  });
  it('static + revalidate:false → public immutable (SSG)', () => {
    expect(deriveCacheControl({ render: 'static', revalidate: false })).toBe(
      'public, max-age=31536000, immutable',
    );
  });
  it('static + revalidate:60 → ISR with stale-while-revalidate=300', () => {
    expect(deriveCacheControl({ render: 'static', revalidate: 60 })).toBe(
      'public, s-maxage=60, stale-while-revalidate=300',
    );
  });
  it('static + revalidate:0 → s-maxage=0 (always revalidate)', () => {
    expect(deriveCacheControl({ render: 'static', revalidate: 0 })).toBe(
      'public, s-maxage=0, stale-while-revalidate=0',
    );
  });
  it('unrecognised config falls back to no-store', () => {
    // render:'static' with no revalidate key → safe fallback
    expect(deriveCacheControl({ render: 'static' })).toBe('no-store');
  });
});
// ─── withHeaders ──────────────────────────────────────────────────────────────
describe('withHeaders', () => {
  it('adds new headers to the response', () => {
    const res = withHeaders(ok(), { 'X-Custom': 'value' });
    expect(res.headers.get('X-Custom')).toBe('value');
  });
  it('preserves existing headers', () => {
    const base = new Response('body', { headers: { 'Content-Type': 'text/html' } });
    const res = withHeaders(base, { 'X-Custom': 'value' });
    expect(res.headers.get('Content-Type')).toBe('text/html');
    expect(res.headers.get('X-Custom')).toBe('value');
  });
  it('overwrites a header already on the response', () => {
    const base = new Response('body', { headers: { 'X-Foo': 'old' } });
    const res = withHeaders(base, { 'X-Foo': 'new' });
    expect(res.headers.get('X-Foo')).toBe('new');
  });
  it('preserves status and statusText', () => {
    const base = new Response('body', { status: 201, statusText: 'Created' });
    const res = withHeaders(base, { 'X-Extra': '1' });
    expect(res.status).toBe(201);
    expect(res.statusText).toBe('Created');
  });
  it('does not mutate the original response', () => {
    const base = ok();
    withHeaders(base, { 'X-New': 'val' });
    expect(base.headers.get('X-New')).toBeNull();
  });
});
// ─── securityHeadersMiddleware ────────────────────────────────────────────────
describe('securityHeadersMiddleware', () => {
  const mw = securityHeadersMiddleware();
  const req = makeReq();
  it('adds X-Frame-Options: DENY', async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });
  it('adds X-Content-Type-Options: nosniff', async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
  it('adds Strict-Transport-Security', async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });
  it('adds Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
  it('adds X-Permitted-Cross-Domain-Policies: none', async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
  });
  it("adds Content-Security-Policy: default-src 'self'", async () => {
    const res = await mw(req, handler);
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
  });
});
// ─── requestIdMiddleware ──────────────────────────────────────────────────────
describe('requestIdMiddleware', () => {
  const mw = requestIdMiddleware();
  it('echoes the incoming x-request-id header in the response', async () => {
    const req = makeReq('GET', { 'x-request-id': 'my-trace-id' });
    const res = await mw(req, handler);
    expect(res.headers.get('X-Request-Id')).toBe('my-trace-id');
  });
  it('generates a UUID when x-request-id is absent', async () => {
    const req = makeReq();
    const res = await mw(req, handler);
    const id = res.headers.get('X-Request-Id');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('generated ID is unique per request', async () => {
    const req = makeReq();
    const r1 = await mw(req, handler);
    const r2 = await mw(req, handler);
    expect(r1.headers.get('X-Request-Id')).not.toBe(r2.headers.get('X-Request-Id'));
  });
});
// ─── cacheControlMiddleware ───────────────────────────────────────────────────
describe('cacheControlMiddleware', () => {
  it('emits no-store for dynamic routes', async () => {
    const mw = cacheControlMiddleware({ render: 'dynamic' });
    const res = await mw(makeReq(), handler);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
  it('emits immutable for static SSG routes', async () => {
    const mw = cacheControlMiddleware({ render: 'static', revalidate: false });
    const res = await mw(makeReq(), handler);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });
  it('emits s-maxage + stale-while-revalidate for ISR routes', async () => {
    const mw = cacheControlMiddleware({ render: 'static', revalidate: 30 });
    const res = await mw(makeReq(), handler);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=30, stale-while-revalidate=150',
    );
  });
});
// ─── corsMiddleware ───────────────────────────────────────────────────────────
describe('corsMiddleware', () => {
  describe('preflight (OPTIONS)', () => {
    it('returns 204 with no body', async () => {
      const mw = corsMiddleware({ origin: '*' });
      const req = makeReq('OPTIONS', { origin: 'https://example.com' });
      const res = await mw(req, handler);
      expect(res.status).toBe(204);
    });
    it('does not call the handler for OPTIONS', async () => {
      let called = false;
      const mw = corsMiddleware({ origin: '*' });
      const req = makeReq('OPTIONS', { origin: 'https://example.com' });
      await mw(req, async () => {
        called = true;
        return ok();
      });
      expect(called).toBe(false);
    });
    it('includes Access-Control-Allow-Methods in preflight', async () => {
      const mw = corsMiddleware({ origin: '*', methods: ['GET', 'POST'] });
      const req = makeReq('OPTIONS', { origin: 'https://a.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });
  describe('regular requests', () => {
    it('wildcard origin — sets Access-Control-Allow-Origin: *', async () => {
      const mw = corsMiddleware({ origin: '*' });
      const req = makeReq('GET', { origin: 'https://any.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
    it('exact string origin — reflects request origin when it matches', async () => {
      const mw = corsMiddleware({ origin: 'https://example.com' });
      const req = makeReq('GET', { origin: 'https://example.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });
    it('exact string origin — does not set header when origin mismatches', async () => {
      const mw = corsMiddleware({ origin: 'https://example.com' });
      const req = makeReq('GET', { origin: 'https://evil.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
    it('array origin — reflects request origin when in allowlist', async () => {
      const mw = corsMiddleware({ origin: ['https://a.com', 'https://b.com'] });
      const req = makeReq('GET', { origin: 'https://b.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://b.com');
    });
    it('array origin — blocks origin not in allowlist', async () => {
      const mw = corsMiddleware({ origin: ['https://a.com', 'https://b.com'] });
      const req = makeReq('GET', { origin: 'https://c.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
    it('credentials: true — adds Access-Control-Allow-Credentials: true', async () => {
      const mw = corsMiddleware({ origin: '*', credentials: true });
      const req = makeReq('GET', { origin: 'https://a.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });
    it('credentials: false — omits Access-Control-Allow-Credentials', async () => {
      const mw = corsMiddleware({ origin: '*' });
      const req = makeReq('GET', { origin: 'https://a.com' });
      const res = await mw(req, handler);
      expect(res.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    });
  });
});
// ─── rateLimitMiddleware ──────────────────────────────────────────────────────
describe('rateLimitMiddleware', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it('allows the first request through', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 1 });
    const req = makeReq('GET', { 'x-forwarded-for': '1.2.3.4' });
    const res = await mw(req, handler);
    expect(res.status).toBe(200);
  });
  it('allows up to max requests and blocks the next', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 2 });
    const req = makeReq('GET', { 'x-forwarded-for': '1.2.3.4' });
    const r1 = await mw(req, handler);
    const r2 = await mw(req, handler);
    const r3 = await mw(req, handler);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
  });
  it('returns Retry-After header on 429', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 1 });
    const req = makeReq('GET', { 'x-forwarded-for': '2.3.4.5' });
    await mw(req, handler); // request 1 — allowed
    const r2 = await mw(req, handler); // request 2 — blocked
    expect(r2.status).toBe(429);
    const retryAfter = r2.headers.get('Retry-After');
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });
  it('resets counter after the window expires', async () => {
    const mw = rateLimitMiddleware({ windowMs: 1_000, max: 1 });
    const req = makeReq('GET', { 'x-forwarded-for': '3.4.5.6' });
    await mw(req, handler); // 1st — ok
    const blocked = await mw(req, handler); // 2nd — 429
    expect(blocked.status).toBe(429);
    vi.advanceTimersByTime(1_001); // window expires
    const after = await mw(req, handler); // 1st in new window — ok
    expect(after.status).toBe(200);
  });
  it('isolates rate limits per key — different IPs are independent', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 1 });
    const req1 = makeReq('GET', { 'x-forwarded-for': '10.0.0.1' });
    const req2 = makeReq('GET', { 'x-forwarded-for': '10.0.0.2' });
    await mw(req1, handler); // IP 1 — first
    const blocked = await mw(req1, handler); // IP 1 — blocked
    const allowed = await mw(req2, handler); // IP 2 — independent, allowed
    expect(blocked.status).toBe(429);
    expect(allowed.status).toBe(200);
  });
  it('uses a custom keyFn when provided', async () => {
    const mw = rateLimitMiddleware({
      windowMs: 60_000,
      max: 1,
      keyFn: (req) => req.headers.get('Authorization') ?? 'anon',
    });
    const authReq = makeReq('GET', { Authorization: 'Bearer tok' });
    await mw(authReq, handler);
    const r2 = await mw(authReq, handler);
    expect(r2.status).toBe(429);
  });
  it('falls back to "global" key when x-forwarded-for is absent', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 1 });
    const req = makeReq('GET'); // no x-forwarded-for
    await mw(req, handler);
    const r2 = await mw(req, handler);
    expect(r2.status).toBe(429);
  });
});
// ─── composeMiddleware ────────────────────────────────────────────────────────
describe('composeMiddleware', () => {
  it('calls handler when middleware list is empty', async () => {
    const dispatch = composeMiddleware([]);
    const res = await dispatch(makeReq(), handler);
    expect(res.status).toBe(200);
  });
  it('executes middleware in order before the handler', async () => {
    const order = [];
    const mw1 = async (_req, next) => {
      order.push('mw1-before');
      const res = await next();
      order.push('mw1-after');
      return res;
    };
    const mw2 = async (_req, next) => {
      order.push('mw2-before');
      const res = await next();
      order.push('mw2-after');
      return res;
    };
    const dispatch = composeMiddleware([mw1, mw2]);
    await dispatch(makeReq(), async (_req) => {
      order.push('handler');
      return ok();
    });
    expect(order).toEqual(['mw1-before', 'mw2-before', 'handler', 'mw2-after', 'mw1-after']);
  });
  it('middleware can short-circuit without calling next()', async () => {
    let handlerCalled = false;
    const blocker = async (_req, _next) => new Response('blocked', { status: 403 });
    const dispatch = composeMiddleware([blocker]);
    const res = await dispatch(makeReq(), async () => {
      handlerCalled = true;
      return ok();
    });
    expect(res.status).toBe(403);
    expect(handlerCalled).toBe(false);
  });
  it('all middleware headers accumulate on the final response', async () => {
    const addA = async (_req, next) => withHeaders(await next(), { 'X-A': 'a' });
    const addB = async (_req, next) => withHeaders(await next(), { 'X-B': 'b' });
    const dispatch = composeMiddleware([addA, addB]);
    const res = await dispatch(makeReq(), handler);
    expect(res.headers.get('X-A')).toBe('a');
    expect(res.headers.get('X-B')).toBe('b');
  });
  it('full stack: security + requestId + cacheControl headers all present', async () => {
    const dispatch = composeMiddleware([
      securityHeadersMiddleware(),
      requestIdMiddleware(),
      cacheControlMiddleware({ render: 'dynamic' }),
    ]);
    const res = await dispatch(makeReq(), handler);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
//# sourceMappingURL=middleware-pipeline.test.js.map
