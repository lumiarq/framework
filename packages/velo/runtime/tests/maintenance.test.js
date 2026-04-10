import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { maintenanceMiddleware } from '../src/middleware/maintenance.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
const SENTINEL_PATH = resolve(
  process.cwd(),
  `.test-maintenance-${Math.random().toString(36).slice(2)}`,
);
function writeSentinel(sentinel = {}) {
  writeFileSync(SENTINEL_PATH, JSON.stringify(sentinel), 'utf-8');
}
function removeSentinel() {
  if (existsSync(SENTINEL_PATH)) unlinkSync(SENTINEL_PATH);
}
function makeReq(options = {}) {
  const url = options.url ?? 'http://localhost/';
  const headers = {};
  if (options.ip) headers['x-forwarded-for'] = options.ip;
  const fullUrl = options.secret ? `${url}?secret=${options.secret}` : url;
  return new Request(fullUrl, { headers });
}
const handler = async () => new Response('ok', { status: 200 });
// ─── maintenanceMiddleware ────────────────────────────────────────────────────
describe('maintenanceMiddleware', () => {
  beforeEach(() => removeSentinel());
  afterEach(() => removeSentinel());
  it('passes through (calls next) when .maintenance file does not exist', async () => {
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe('ok');
  });
  it('returns 503 when .maintenance file exists', async () => {
    writeSentinel();
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    expect(res.status).toBe(503);
  });
  it('returns 503 body with the configured message', async () => {
    writeSentinel({ message: 'We are upgrading the system.' });
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    const body = await res.json();
    expect(body.message).toBe('We are upgrading the system.');
  });
  it('returns a default message when the sentinel has no message field', async () => {
    writeSentinel({});
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    const body = await res.json();
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });
  it('passes through when client IP is in allowedIps', async () => {
    writeSentinel({ allowedIps: ['10.0.0.1'] });
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq({ ip: '10.0.0.1' }), handler);
    expect(res.status).toBe(200);
  });
  it('returns 503 when client IP is NOT in allowedIps', async () => {
    writeSentinel({ allowedIps: ['10.0.0.1'] });
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq({ ip: '10.0.0.2' }), handler);
    expect(res.status).toBe(503);
  });
  it('passes through when ?secret= matches sentinel.secret', async () => {
    writeSentinel({ secret: 'super-secret-key' });
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq({ secret: 'super-secret-key' }), handler);
    expect(res.status).toBe(200);
  });
  it('returns 503 when ?secret= does not match sentinel.secret', async () => {
    writeSentinel({ secret: 'super-secret-key' });
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq({ secret: 'wrong-key' }), handler);
    expect(res.status).toBe(503);
  });
  it('includes Retry-After: 60 header on 503 response', async () => {
    writeSentinel();
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    expect(res.headers.get('Retry-After')).toBe('60');
  });
  it('includes Content-Type: application/json on 503 response', async () => {
    writeSentinel();
    const mw = maintenanceMiddleware(SENTINEL_PATH);
    const res = await mw(makeReq(), handler);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
//# sourceMappingURL=maintenance.test.js.map
