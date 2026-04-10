/**
 * Middleware pipeline — composes and executes route middleware.
 * Security middleware (CORS, rate-limit, security-headers) is now owned by
 * @illumiarq/security and re-exported here for backward compatibility.
 */

import { generateRequestId } from '@illumiarq/core';
import type { RenderMode } from '@illumiarq/http';

// ─── Re-export from @illumiarq/security (backward compat) ────────────────────
export type { MiddlewareFn, CorsOptions, RateLimitOptions } from '@illumiarq/security';
export {
  withHeaders,
  securityHeadersMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
} from '@illumiarq/security';

// ─── Local types ─────────────────────────────────────────────────────────────

import type { MiddlewareFn } from '@illumiarq/security';

export interface RouteRenderConfig {
  render: RenderMode;
  revalidate?: number | false;
}

// ─── Pure utilities ──────────────────────────────────────────────────────────

import { withHeaders } from '@illumiarq/security';

/** Derives the correct Cache-Control header value per the rendering strategy table. */
export function deriveCacheControl(config: RouteRenderConfig): string {
  if (config.render === 'dynamic') return 'no-store';
  if (config.render === 'static' && config.revalidate === false)
    return 'public, max-age=31536000, immutable';
  if (config.render === 'static' && typeof config.revalidate === 'number') {
    const s = config.revalidate;
    const swr = 5 * s;
    return `public, s-maxage=${s}, stale-while-revalidate=${swr}`;
  }
  return 'no-store';
}

/** Reads or generates X-Request-Id and echoes it in the response. */
export function requestIdMiddleware(): MiddlewareFn {
  return async (req, next) => {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const id = generateRequestId(headers);
    return withHeaders(await next(), { 'X-Request-Id': id });
  };
}

/** Emits the correct Cache-Control header for the given render config. */
export function cacheControlMiddleware(config: RouteRenderConfig): MiddlewareFn {
  const value = deriveCacheControl(config);
  return async (_req, next) => withHeaders(await next(), { 'Cache-Control': value });
}

// ─── Pipeline composer ───────────────────────────────────────────────────────

/**
 * Composes an ordered list of middleware functions into a single dispatcher.
 */
export function composeMiddleware(
  middlewares: MiddlewareFn[],
): (req: Request, handler: (req: Request) => Promise<Response>) => Promise<Response> {
  return async (req, handler) => {
    let index = 0;

    async function next(): Promise<Response> {
      if (index < middlewares.length) {
        const mw = middlewares[index++]!;
        return mw(req, next);
      }
      return handler(req);
    }

    return next();
  };
}
