// ---------------------------------------------------------------------------
// Request helpers — pure functions that read from request headers.
//
// Trust-proxies middleware must run FIRST in the pipeline so that
// X-Forwarded-* headers are normalised before these helpers are called.
// ---------------------------------------------------------------------------
/**
 * Returns the client IP address.
 *
 * Reads the first (leftmost) value from `X-Forwarded-For`; falls back to
 * `X-Real-IP`; returns `''` when neither header is present.
 */
export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    return first ? first.trim() : '';
  }
  return req.headers.get('x-real-ip') ?? '';
}
/**
 * Returns `true` when the request was made over HTTPS.
 *
 * Reads `X-Forwarded-Proto`; falls back to inspecting `req.url` protocol.
 */
export function isRequestSecure(req) {
  const proto = req.headers.get('x-forwarded-proto');
  if (proto) return proto === 'https';
  try {
    return new URL(req.url).protocol === 'https:';
  } catch {
    return false;
  }
}
/**
 * Returns the effective host for the request.
 *
 * Prefers `X-Forwarded-Host`; falls back to the `Host` header; returns `''`
 * when neither is present.
 */
export function getRequestHost(req) {
  return req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
}
/**
 * Returns `true` when the client signals it expects a JSON response.
 *
 * Checks whether the `Accept` header contains `'application/json'`.
 */
export function expectsJson(req) {
  const accept = req.headers.get('accept') ?? '';
  return accept.includes('application/json');
}
//# sourceMappingURL=req.js.map
