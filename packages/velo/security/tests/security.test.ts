import { describe, it, expect } from 'vitest';
import { securityHeadersMiddleware } from '../src/security-headers.js';
import { corsMiddleware } from '../src/cors.js';
import { rateLimitMiddleware } from '../src/rate-limit.js';
import { maintenanceMiddleware } from '../src/maintenance.js';
import { trustProxiesMiddleware } from '../src/trust-proxies.js';
import { withHeaders } from '../src/utils.js';

const ok = () => Promise.resolve(new Response('OK', { status: 200 }));
const req = (url = 'http://localhost/', opts?: RequestInit) => new Request(url, opts);

describe('withHeaders', () => {
  it('adds headers to a response without mutating the original', async () => {
    const original = new Response('body', { status: 200 });
    const result = withHeaders(original, { 'X-Test': 'yes' });
    expect(result.headers.get('X-Test')).toBe('yes');
    expect(original.headers.get('X-Test')).toBeNull();
  });
});

describe('securityHeadersMiddleware', () => {
  it('adds X-Frame-Options: DENY', async () => {
    const mw = securityHeadersMiddleware();
    const res = await mw(req(), ok);
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('adds Content-Security-Policy', async () => {
    const mw = securityHeadersMiddleware();
    const res = await mw(req(), ok);
    expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
  });
});

describe('corsMiddleware', () => {
  it('returns 204 for OPTIONS preflight', async () => {
    const mw = corsMiddleware({ origin: '*' });
    const res = await mw(req('http://localhost/', { method: 'OPTIONS' }), ok);
    expect(res.status).toBe(204);
  });

  it('adds Access-Control-Allow-Origin for allowed origin', async () => {
    const mw = corsMiddleware({ origin: 'https://example.com' });
    const r = new Request('http://localhost/', { headers: { origin: 'https://example.com' } });
    const res = await mw(r, ok);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
  });

  it('does not set origin header for disallowed origin', async () => {
    const mw = corsMiddleware({ origin: 'https://allowed.com' });
    const r = new Request('http://localhost/', { headers: { origin: 'https://evil.com' } });
    const res = await mw(r, ok);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('rateLimitMiddleware', () => {
  it('passes requests under the limit', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 5 });
    const r = new Request('http://localhost/', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    const res = await mw(r, ok);
    expect(res.status).toBe(200);
  });

  it('returns 429 when limit is exceeded', async () => {
    const mw = rateLimitMiddleware({ windowMs: 60_000, max: 2 });
    const r = () => new Request('http://localhost/', { headers: { 'x-forwarded-for': '5.6.7.8' } });
    await mw(r(), ok);
    await mw(r(), ok);
    const res = await mw(r(), ok);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeDefined();
  });
});

describe('maintenanceMiddleware', () => {
  it('passes through when no .maintenance file exists', async () => {
    const mw = maintenanceMiddleware('/nonexistent/.maintenance');
    const res = await mw(req(), ok);
    expect(res.status).toBe(200);
  });
});

describe('trustProxiesMiddleware', () => {
  it('does not set x-real-ip when proxy is not trusted', async () => {
    const mw = trustProxiesMiddleware({ trust: ['10.0.0.1'] });
    const r = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '203.0.113.1, 8.8.8.8' },
    });
    const res = await mw(r, ok);
    expect(res.headers.get('x-real-ip')).toBeNull();
  });

  it('sets x-real-ip when proxy is trusted', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const r = new Request('http://localhost/', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 10.0.0.1',
        'x-forwarded-proto': 'https',
      },
    });
    const res = await mw(r, ok);
    expect(res.headers.get('x-real-ip')).toBe('203.0.113.1');
  });
});
