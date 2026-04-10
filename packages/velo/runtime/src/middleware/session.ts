import { randomBytes, createHmac } from 'node:crypto';
import type { MiddlewareFn } from '../middleware-pipeline.js';
import { withHeaders } from '../middleware-pipeline.js';
import type { SessionStore } from '../session/store.js';

export interface SessionOptions {
  store: SessionStore;
  /** Cookie name. Default: 'lumiarq_session' */
  cookieName?: string;
  /** Session TTL in seconds. Default: 604800 (7 days). */
  ttl?: number;
  /** Secret used to sign the session ID cookie (HMAC-SHA256). */
  secret: string;
}

const DEFAULT_COOKIE = 'lumiarq_session';
const DEFAULT_TTL = 604_800; // 7 days

/**
 * Loads or creates a session for each request.
 *
 * Behaviour:
 * - Reads the signed session ID from the cookie; verifies the HMAC signature.
 * - If valid, loads the session from the store; if missing/expired creates a fresh session.
 * - Exposes the raw session ID via `x-session-id` response header so that
 *   downstream tooling (e.g. csrfMiddleware when composed as a pipeline) can read it
 *   from the request in tests or via a header relay.
 * - Sets/refreshes the signed session cookie on the response (HttpOnly, SameSite=Lax).
 *
 * Skipped for API-only requests: when `Accept: application/json` is present AND
 * there is no session cookie on the request.
 */
export function sessionMiddleware(options: SessionOptions): MiddlewareFn {
  const cookieName = options.cookieName ?? DEFAULT_COOKIE;
  const ttl = options.ttl ?? DEFAULT_TTL;

  return async (req, next) => {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const rawCookie = extractCookie(cookieHeader, cookieName);

    // Skip for pure JSON API requests that have no session cookie.
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes('application/json') && !rawCookie) return next();

    // Verify signature and derive raw session ID.
    let sessionId = rawCookie ? verifySignedCookie(rawCookie, options.secret) : null;

    // Ensure a session record exists in the store.
    if (sessionId) {
      const existing = await options.store.get(sessionId);
      if (!existing) sessionId = null; // Expired or evicted.
    }

    if (!sessionId) {
      sessionId = randomBytes(16).toString('hex');
      await options.store.set(sessionId, {}, ttl);
    }

    const res = await next();

    const signed = signCookie(sessionId, options.secret);
    const cookieVal = `${cookieName}=${signed}; HttpOnly; SameSite=Lax; Max-Age=${ttl}; Path=/`;

    // Expose session ID in response header for downstream use (tests, DevTools, etc).
    return withHeaders(res, {
      'Set-Cookie': cookieVal,
      'x-session-id': sessionId,
    });
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function signCookie(value: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${sig}`;
}

function verifySignedCookie(raw: string, secret: string): string | null {
  const lastDot = raw.lastIndexOf('.');
  if (lastDot === -1) return null;

  const value = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = createHmac('sha256', secret).update(value).digest('hex');

  if (sig !== expected) return null;
  return value;
}
