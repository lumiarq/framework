/**
 * lumiarq.csrf — built-in CSRF protection middleware.
 *
 * For state-mutating requests (POST, PUT, PATCH, DELETE), verifies that the
 * `X-CSRF-Token` header matches the token stored in the `_csrf` cookie.
 *
 * Safe methods (GET, HEAD, OPTIONS) are always allowed through.
 *
 * Usage in routes:
 * ```ts
 * Route.post('/account/update', updateAccountHandler, {
 *   middleware: ['lumiarq.csrf'],
 * })
 * ```
 *
 * Or protect an entire group:
 * ```ts
 * Route.group({ prefix: '/account', middleware: ['lumiarq.csrf'] }, () => {
 *   Route.post('/update', updateAccountHandler)
 *   Route.delete('/delete', deleteAccountHandler)
 * })
 * ```
 */

import { defineMiddleware } from '../define-middleware.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfMiddleware = defineMiddleware({
  name: 'lumiarq.csrf',
  priority: 90,
  handler: async (req, next) => {
    const method = req.method.toUpperCase();

    if (SAFE_METHODS.has(method)) {
      return next();
    }

    const headerToken = req.headers.get('X-CSRF-Token');
    const cookie = req.headers.get('Cookie') ?? '';
    const csrfCookie = cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('_csrf='));

    const cookieToken = csrfCookie ? csrfCookie.slice(6) : null;

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return new Response(JSON.stringify({ error: 'Forbidden', message: 'CSRF token mismatch.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  },
});
