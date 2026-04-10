import { randomBytes, timingSafeEqual } from 'node:crypto';
import { withHeaders } from './utils.js';
const SESSION_KEY = '_csrf_token';
const SESSION_TTL = 7 * 24 * 60 * 60;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/**
 * CSRF protection using the synchronizer token pattern.
 * Safe methods: read/generate token, set X-CSRF-Token response header.
 * Mutating methods: validate submitted token; return 419 on mismatch.
 * Skipped for routes matching excludePrefix (default: '/api/').
 */
export function csrfMiddleware(options) {
  const exclude = options.excludePrefix ?? '/api/';
  return async (req, next) => {
    if (req.url.includes(exclude)) return next();
    if (req.headers.get('x-skip-csrf') === '1') return next();
    const sessionId = deriveSessionId(req);
    if (!sessionId) return next();
    if (SAFE_METHODS.has(req.method)) {
      let token;
      const session = await options.sessionStore.get(sessionId);
      if (session && typeof session[SESSION_KEY] === 'string') {
        token = session[SESSION_KEY];
      } else {
        token = randomBytes(32).toString('hex');
        await options.sessionStore.set(
          sessionId,
          { ...session, [SESSION_KEY]: token },
          SESSION_TTL,
        );
      }
      return withHeaders(await next(), { 'X-CSRF-Token': token });
    }
    const session = await options.sessionStore.get(sessionId);
    const stored = typeof session?.[SESSION_KEY] === 'string' ? session[SESSION_KEY] : null;
    if (!stored) return csrfError();
    const submitted = await readSubmittedToken(req);
    if (!submitted) return csrfError();
    if (!safeCompare(stored, submitted)) return csrfError();
    return next();
  };
}
function csrfError() {
  return new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), {
    status: 419,
    headers: { 'Content-Type': 'application/json' },
  });
}
function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
function deriveSessionId(req) {
  const header = req.headers.get('x-session-id');
  if (header) return header;
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/lumiarq_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
function parseMultipartToken(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) return null;
  for (const rawPart of body.split(`--${boundary}`)) {
    const part = rawPart.trim();
    if (!part || part === '--') continue;
    const normalized = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const separatorIndex = normalized.indexOf('\r\n\r\n');
    if (separatorIndex === -1) continue;
    const headerBlock = normalized.slice(0, separatorIndex);
    if (/filename=/i.test(headerBlock)) continue;
    const nameMatch = headerBlock.match(/name="([^"]+)"/i);
    if (nameMatch?.[1] !== '_token') continue;
    return normalized.slice(separatorIndex + 4).replace(/\r\n$/, '');
  }
  return null;
}
async function readSubmittedToken(req) {
  const headerToken = req.headers.get('x-csrf-token');
  if (headerToken) return headerToken;
  const contentType = req.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = await req.clone().json();
      const t = body['_token'];
      return typeof t === 'string' ? t : null;
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.clone().text();
      return new URLSearchParams(body).get('_token');
    }
    if (contentType.includes('multipart/form-data')) {
      const body = await req.clone().text();
      return parseMultipartToken(body, contentType);
    }
  } catch {
    /* empty */
  }
  return null;
}
//# sourceMappingURL=csrf.js.map
