const DEFAULT_WINDOW = 10_800; // 3 hours in seconds
const DEFAULT_REDIRECT = '/confirm-password';
const DEFAULT_API_PREFIX = '/api/';
const SESSION_KEY = '__confirmed_at';
const DEFAULT_TTL = 604_800; // 7 days in seconds
/**
 * Password-confirmation middleware.
 *
 * Guards routes that require recent re-authentication. Reads `__confirmed_at`
 * (a Unix timestamp in ms) from the session and rejects the request when the
 * timestamp is absent or older than `window` seconds.
 *
 * - API routes (URL contains `apiPrefix`) → 423 JSON response.
 * - Web routes → 302 redirect to `redirectTo`.
 * - Valid confirmation → calls `next()`.
 */
export function confirmedMiddleware(options) {
  const windowSecs = options.window ?? DEFAULT_WINDOW;
  const redirectTo = options.redirectTo ?? DEFAULT_REDIRECT;
  const apiPrefix = options.apiPrefix ?? DEFAULT_API_PREFIX;
  return async (req, next) => {
    const sessionId = deriveSessionId(req);
    if (!sessionId) return deny(req.url, apiPrefix, redirectTo);
    const session = await options.sessionStore.get(sessionId);
    const confirmedAt = session?.[SESSION_KEY];
    const isValid =
      typeof confirmedAt === 'number' && Date.now() - confirmedAt <= windowSecs * 1000;
    if (!isValid) return deny(req.url, apiPrefix, redirectTo);
    return next();
  };
}
/**
 * Writes the current timestamp (`Date.now()`) to the session under
 * `__confirmed_at`. Call this from the ConfirmPasswordAction after a
 * successful re-authentication.
 */
export async function writeConfirmedAt(sessionId, store, ttl) {
  const session = (await store.get(sessionId)) ?? {};
  await store.set(sessionId, { ...session, [SESSION_KEY]: Date.now() }, ttl ?? DEFAULT_TTL);
}
// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------
function deny(url, apiPrefix, redirectTo) {
  if (url.includes(apiPrefix)) {
    return new Response(JSON.stringify({ message: 'Password confirmation required.' }), {
      status: 423,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: redirectTo },
  });
}
/**
 * Extracts the session ID from the `x-session-id` header (set by sessionMiddleware).
 * Falls back to the `lumiarq_session` cookie for standalone usage.
 */
function deriveSessionId(req) {
  const header = req.headers.get('x-session-id');
  if (header) return header;
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/lumiarq_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
//# sourceMappingURL=confirmed.js.map
