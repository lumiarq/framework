/**
 * Sliding-window rate limiter keyed by x-forwarded-for or a custom keyFn.
 * Returns 429 Too Many Requests when the limit is exceeded.
 */
export function rateLimitMiddleware(options) {
  const store = new Map();
  return async (req, next) => {
    const key = options.keyFn?.(req) ?? req.headers.get('x-forwarded-for') ?? 'global';
    const now = Date.now();
    const curr = store.get(key);
    if (!curr || curr.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
    } else {
      curr.count++;
      if (curr.count > options.max) {
        const retryAfter = String(Math.ceil((curr.resetAt - now) / 1000));
        return new Response('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': retryAfter, 'Content-Type': 'text/plain' },
        });
      }
    }
    return next();
  };
}
//# sourceMappingURL=rate-limit.js.map
