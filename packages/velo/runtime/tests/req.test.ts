import { describe, it, expect } from 'vitest';
import { getClientIp, isRequestSecure, getRequestHost, expectsJson } from '../src/helpers/req.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/test', { headers });
}

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('returns the first IP from X-Forwarded-For', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('handles a single IP in X-Forwarded-For', () => {
    const req = makeReq({ 'x-forwarded-for': '203.0.113.7' });
    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  it('trims whitespace from the first hop', () => {
    const req = makeReq({ 'x-forwarded-for': '  10.0.0.1  , 10.0.0.2' });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to X-Real-IP when X-Forwarded-For is absent', () => {
    const req = makeReq({ 'x-real-ip': '172.16.0.5' });
    expect(getClientIp(req)).toBe('172.16.0.5');
  });

  it('returns empty string when neither header is present', () => {
    const req = makeReq();
    expect(getClientIp(req)).toBe('');
  });

  it('prefers X-Forwarded-For over X-Real-IP', () => {
    const req = makeReq({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' });
    expect(getClientIp(req)).toBe('1.1.1.1');
  });
});

// ─── isRequestSecure ──────────────────────────────────────────────────────────

describe('isRequestSecure', () => {
  it('returns true when X-Forwarded-Proto is "https"', () => {
    const req = makeReq({ 'x-forwarded-proto': 'https' });
    expect(isRequestSecure(req)).toBe(true);
  });

  it('returns false when X-Forwarded-Proto is "http"', () => {
    const req = makeReq({ 'x-forwarded-proto': 'http' });
    expect(isRequestSecure(req)).toBe(false);
  });

  it('falls back to URL protocol when header is absent (http URL)', () => {
    const req = new Request('http://example.com/');
    expect(isRequestSecure(req)).toBe(false);
  });

  it('falls back to URL protocol when header is absent (https URL)', () => {
    const req = new Request('https://example.com/');
    expect(isRequestSecure(req)).toBe(true);
  });

  it('prefers X-Forwarded-Proto over URL protocol', () => {
    // URL is http but header says https (behind proxy).
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(isRequestSecure(req)).toBe(true);
  });
});

// ─── getRequestHost ───────────────────────────────────────────────────────────

describe('getRequestHost', () => {
  it('returns X-Forwarded-Host when present', () => {
    const req = makeReq({ 'x-forwarded-host': 'app.example.com', host: 'localhost' });
    expect(getRequestHost(req)).toBe('app.example.com');
  });

  it('falls back to Host header when X-Forwarded-Host is absent', () => {
    const req = makeReq({ host: 'localhost:3000' });
    expect(getRequestHost(req)).toBe('localhost:3000');
  });

  it('returns empty string when neither header is present', () => {
    const req = makeReq();
    expect(getRequestHost(req)).toBe('');
  });
});

// ─── expectsJson ─────────────────────────────────────────────────────────────

describe('expectsJson', () => {
  it('returns true when Accept is exactly "application/json"', () => {
    const req = makeReq({ accept: 'application/json' });
    expect(expectsJson(req)).toBe(true);
  });

  it('returns true when Accept includes "application/json" alongside other types', () => {
    const req = makeReq({ accept: 'text/html, application/json, */*' });
    expect(expectsJson(req)).toBe(true);
  });

  it('returns false when Accept is "text/html"', () => {
    const req = makeReq({ accept: 'text/html' });
    expect(expectsJson(req)).toBe(false);
  });

  it('returns false when Accept header is absent', () => {
    const req = makeReq();
    expect(expectsJson(req)).toBe(false);
  });
});
