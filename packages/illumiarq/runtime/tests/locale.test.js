import { describe, it, expect } from 'vitest';
import { localeMiddleware } from '../src/middleware/locale.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(acceptLanguage) {
  const headers = {};
  if (acceptLanguage !== undefined) headers['accept-language'] = acceptLanguage;
  return new Request('http://localhost/', { headers });
}
const handler = async () => new Response('ok', { status: 200 });
const opts = {
  supported: ['en', 'fr', 'es', 'de'],
  default: 'en',
};
// ─── localeMiddleware ─────────────────────────────────────────────────────────
describe('localeMiddleware', () => {
  it('detects a supported locale from Accept-Language header (exact match)', async () => {
    const mw = localeMiddleware(opts);
    const req = makeReq('fr');
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('fr');
  });
  it('detects locale with regional subtag via primary match (fr-CH → fr)', async () => {
    const mw = localeMiddleware(opts);
    const req = makeReq('fr-CH');
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('fr');
  });
  it('picks highest-quality supported locale from list', async () => {
    const mw = localeMiddleware(opts);
    // zh is not supported; fr at q=0.9 should be chosen
    const req = makeReq('zh-CN;q=1.0, fr;q=0.9, en;q=0.8');
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('fr');
  });
  it('falls back to default when Accept-Language header has no supported match', async () => {
    const mw = localeMiddleware(opts);
    const req = makeReq('ja, zh');
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('en');
  });
  it('falls back to default when Accept-Language header is absent', async () => {
    const mw = localeMiddleware(opts);
    const req = makeReq();
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('en');
  });
  it('uses a custom default locale when configured', async () => {
    const mw = localeMiddleware({ supported: ['en', 'fr'], default: 'fr' });
    const req = makeReq('ja');
    const res = await mw(req, handler);
    expect(res.headers.get('x-resolved-locale')).toBe('fr');
  });
  it('passes through the response body and status unchanged', async () => {
    const mw = localeMiddleware(opts);
    const req = makeReq('es');
    const res = await mw(req, handler);
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe('ok');
  });
});
//# sourceMappingURL=locale.test.js.map
