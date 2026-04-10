import { describe, it, expect } from 'vitest';
import { buildBackResponse } from '../src/helpers/back.js';

// ─── buildBackResponse ────────────────────────────────────────────────────────

const APP_URL = 'https://example.com';
const FALLBACK = '/dashboard';

function makeReq(referer?: string): Request {
  const headers: Record<string, string> = {};
  if (referer) headers['referer'] = referer;
  return new Request('https://example.com/profile', { headers });
}

describe('buildBackResponse', () => {
  it('returns 302 redirect', () => {
    const res = buildBackResponse(makeReq(), FALLBACK, APP_URL);
    expect(res.status).toBe(302);
  });

  it('redirects to referer when same-origin', () => {
    const referer = 'https://example.com/settings';
    const res = buildBackResponse(makeReq(referer), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(referer);
  });

  it('redirects to fallback when referer is cross-origin', () => {
    const res = buildBackResponse(makeReq('https://evil.com/page'), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(FALLBACK);
  });

  it('redirects to fallback when no Referer header is present', () => {
    const res = buildBackResponse(makeReq(), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(FALLBACK);
  });

  it('redirects to fallback when Referer is an invalid URL', () => {
    const res = buildBackResponse(makeReq('not-a-valid-url'), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(FALLBACK);
  });

  it('redirects to "/" when fallback is empty string and no same-origin referer', () => {
    const res = buildBackResponse(makeReq(), '', APP_URL);
    expect(res.headers.get('Location')).toBe('/');
  });

  it('redirects to "/" when fallback is empty string even with cross-origin referer', () => {
    const res = buildBackResponse(makeReq('https://other.com/'), '', APP_URL);
    expect(res.headers.get('Location')).toBe('/');
  });

  it('handles subdomain as different origin (cross-origin)', () => {
    const res = buildBackResponse(makeReq('https://sub.example.com/page'), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(FALLBACK);
  });

  it('handles same-origin with path and query string', () => {
    const referer = 'https://example.com/search?q=test&page=2';
    const res = buildBackResponse(makeReq(referer), FALLBACK, APP_URL);
    expect(res.headers.get('Location')).toBe(referer);
  });
});
