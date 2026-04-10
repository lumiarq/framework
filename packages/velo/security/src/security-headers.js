import { withHeaders } from './utils.js';
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': "default-src 'self'",
};
/**
 * Adds standard HTTP security headers to every response.
 * Does not override headers already set by the handler.
 */
export function securityHeadersMiddleware() {
  return async (_req, next) => withHeaders(await next(), SECURITY_HEADERS);
}
//# sourceMappingURL=security-headers.js.map
