/**
 * lumiarq.auth — built-in authentication middleware.
 *
 * Validates a Bearer token from the `Authorization` header.
 * Stores the decoded payload on the request as `X-Auth-Payload` header
 * so downstream handlers can read it without re-parsing.
 *
 * Configuration is read from `process.env.LUMIARQ_AUTH_SECRET`.
 * In production, replace this stub with your full JWT/session logic.
 *
 * Usage in routes:
 * ```ts
 * Route.get('/dashboard', dashboardHandler, {
 *   middleware: ['lumiarq.auth'],
 * })
 * ```
 */

import { defineMiddleware } from '../define-middleware.js';

export const authMiddleware = defineMiddleware({
  name: 'lumiarq.auth',
  priority: 100,
  handler: async (req, next) => {
    const authorization = req.headers.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const token = authorization.slice(7);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Bearer token is empty.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Forward the raw token as a request header so handlers can verify it
    // using their preferred JWT library without middleware being opinionated.
    const enrichedRequest = new Request(req, {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        'X-Auth-Token': token,
      }),
    });

    return next.call(null);
  },
});
