/**
 * lumiarq.throttle — built-in rate limiting middleware.
 *
 * Uses an in-memory sliding window counter keyed on the client IP address.
 * Default limits: 60 requests per 60-second window.
 *
 * In production, replace the in-memory store with a Redis or Durable Object
 * backed counter for distributed rate limiting across instances.
 *
 * Usage:
 * ```ts
 * Route.post('/auth/login', loginHandler, {
 *   middleware: ['lumiarq.throttle'],
 * })
 * ```
 */

import { defineMiddleware } from '../define-middleware.js';

interface WindowEntry {
  count: number;
  resetAt: number;
}

const _store = new Map<string, WindowEntry>();

const WINDOW_MS = 60_000;  // 1 minute
const MAX_REQUESTS = 60;

export const throttleMiddleware = defineMiddleware({
  name: 'lumiarq.throttle',
  priority: 80,
  handler: async (req, next) => {
    const ip =
      req.headers.get('CF-Connecting-IP') ??
      req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
      req.headers.get('X-Real-IP') ??
      'unknown';

    const now = Date.now();
    const entry = _store.get(ip);

    if (!entry || now >= entry.resetAt) {
      _store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    if (entry.count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        },
      );
    }

    entry.count++;

    const response = await next();

    // Attach rate limit headers to every response
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    headers.set('X-RateLimit-Remaining', String(MAX_REQUESTS - entry.count));
    headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
});
