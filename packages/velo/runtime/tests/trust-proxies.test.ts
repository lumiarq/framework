import { describe, it, expect } from 'vitest';
import { trustProxiesMiddleware } from '../src/middleware/trust-proxies.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { headers });
}

const handler = async () => new Response('ok', { status: 200 });

// ─── trustProxiesMiddleware ───────────────────────────────────────────────────

describe('trustProxiesMiddleware', () => {
  it('passes request through and calls next when trust: "*"', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4' });
    const res = await mw(req, handler);
    expect(res.status).toBe(200);
  });

  it('adds x-real-ip header from X-Forwarded-For when trust: "*"', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    const res = await mw(req, handler);
    expect(res.headers.get('x-real-ip')).toBe('1.2.3.4');
  });

  it('adds x-real-ip from single IP in X-Forwarded-For', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq({ 'x-forwarded-for': '203.0.113.5' });
    const res = await mw(req, handler);
    expect(res.headers.get('x-real-ip')).toBe('203.0.113.5');
  });

  it('sets x-is-secure to "1" when x-forwarded-proto is https', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq({
      'x-forwarded-for': '1.2.3.4',
      'x-forwarded-proto': 'https',
    });
    const res = await mw(req, handler);
    expect(res.headers.get('x-is-secure')).toBe('1');
  });

  it('sets x-is-secure to "0" when x-forwarded-proto is http', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq({
      'x-forwarded-for': '1.2.3.4',
      'x-forwarded-proto': 'http',
    });
    const res = await mw(req, handler);
    expect(res.headers.get('x-is-secure')).toBe('0');
  });

  it('adds x-real-ip when the proxy IP is in the trust list', async () => {
    const mw = trustProxiesMiddleware({ trust: ['10.0.0.1'] });
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    const res = await mw(req, handler);
    expect(res.headers.get('x-real-ip')).toBe('1.2.3.4');
  });

  it('does NOT add x-real-ip when the proxy IP is not trusted', async () => {
    const mw = trustProxiesMiddleware({ trust: ['192.168.1.1'] });
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    const res = await mw(req, handler);
    // Passes through without modifying headers since proxy is not trusted
    expect(res.status).toBe(200);
    expect(res.headers.get('x-real-ip')).toBeNull();
  });

  it('passes through without x-real-ip when X-Forwarded-For is absent', async () => {
    const mw = trustProxiesMiddleware({ trust: '*' });
    const req = makeReq();
    const res = await mw(req, handler);
    expect(res.status).toBe(200);
    // No x-real-ip since no X-Forwarded-For was provided
    expect(res.headers.get('x-real-ip')).toBeNull();
  });
});
