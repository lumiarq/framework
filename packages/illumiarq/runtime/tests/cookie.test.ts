import { describe, it, expect } from 'vitest';
import { buildSetCookieHeader, buildClearCookieHeader } from '../src/helpers/cookie.js';

// ─── buildSetCookieHeader ─────────────────────────────────────────────────────

describe('buildSetCookieHeader', () => {
  it('includes name=value pair', () => {
    const header = buildSetCookieHeader('token', 'abc123');
    expect(header).toContain('token=abc123');
  });

  it('sets HttpOnly by default', () => {
    const header = buildSetCookieHeader('token', 'abc');
    expect(header).toContain('HttpOnly');
  });

  it('sets SameSite=Lax by default', () => {
    const header = buildSetCookieHeader('token', 'abc');
    expect(header).toContain('SameSite=Lax');
  });

  it('sets Path=/ by default', () => {
    const header = buildSetCookieHeader('token', 'abc');
    expect(header).toContain('Path=/');
  });

  it('does NOT include Secure by default', () => {
    const header = buildSetCookieHeader('token', 'abc');
    expect(header).not.toContain('Secure');
  });

  it('includes Max-Age when provided', () => {
    const header = buildSetCookieHeader('token', 'abc', { maxAge: 3600 });
    expect(header).toContain('Max-Age=3600');
  });

  it('includes Expires when provided', () => {
    const date = new Date('2030-01-01T00:00:00.000Z');
    const header = buildSetCookieHeader('token', 'abc', { expires: date });
    expect(header).toContain('Expires=Tue, 01 Jan 2030 00:00:00 GMT');
  });

  it('includes custom Path when provided', () => {
    const header = buildSetCookieHeader('token', 'abc', { path: '/app' });
    expect(header).toContain('Path=/app');
  });

  it('includes Domain when provided', () => {
    const header = buildSetCookieHeader('token', 'abc', { domain: 'example.com' });
    expect(header).toContain('Domain=example.com');
  });

  it('respects sameSite=Strict', () => {
    const header = buildSetCookieHeader('token', 'abc', { sameSite: 'Strict' });
    expect(header).toContain('SameSite=Strict');
  });

  it('respects sameSite=None', () => {
    const header = buildSetCookieHeader('token', 'abc', { sameSite: 'None' });
    expect(header).toContain('SameSite=None');
  });

  it('omits HttpOnly when httpOnly: false', () => {
    const header = buildSetCookieHeader('token', 'abc', { httpOnly: false });
    expect(header).not.toContain('HttpOnly');
  });

  it('includes Secure when secure: true', () => {
    const header = buildSetCookieHeader('token', 'abc', { secure: true });
    expect(header).toContain('Secure');
  });

  it('produces full header with all options set', () => {
    const date = new Date('2030-06-01T12:00:00.000Z');
    const header = buildSetCookieHeader('session', 'xyz', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: true,
      maxAge: 86400,
      expires: date,
      path: '/admin',
      domain: 'app.example.com',
    });

    expect(header).toContain('session=xyz');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Secure');
    expect(header).toContain('Max-Age=86400');
    expect(header).toContain('Path=/admin');
    expect(header).toContain('Domain=app.example.com');
  });
});

// ─── buildClearCookieHeader ───────────────────────────────────────────────────

describe('buildClearCookieHeader', () => {
  it('sets Max-Age=0 to expire the cookie', () => {
    const header = buildClearCookieHeader('token');
    expect(header).toContain('Max-Age=0');
  });

  it('includes the cookie name', () => {
    const header = buildClearCookieHeader('session');
    expect(header).toContain('session=');
  });

  it('defaults to Path=/', () => {
    const header = buildClearCookieHeader('token');
    expect(header).toContain('Path=/');
  });

  it('uses a custom path when provided', () => {
    const header = buildClearCookieHeader('token', '/admin');
    expect(header).toContain('Path=/admin');
  });
});
