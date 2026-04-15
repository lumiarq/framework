/**
 * lumiarq.traze — built-in request observability middleware.
 *
 * This middleware captures request duration and status for all routes.
 * A runtime-provided logger can be injected during boot for structured output.
 */

import { defineMiddleware } from '../define-middleware.js';

type TrazeLogger = {
  info: (message: string, context?: Record<string, unknown>) => Promise<void>;
  error: (message: string, context?: Record<string, unknown>) => Promise<void>;
};

let _logger: TrazeLogger | undefined;

export function setTrazeLogger(logger: TrazeLogger | undefined): void {
  _logger = logger;
}

export const trazeMiddleware = defineMiddleware({
  name: 'lumiarq.traze',
  priority: 70,
  handler: async (req, next) => {
    const startedAt = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    try {
      const response = await next();
      const durationMs = Date.now() - startedAt;

      await _logger?.info('http.request', {
        http: {
          method,
          path,
          status: response.status,
          durationMs,
        },
      });

      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${durationMs}ms`);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      await _logger?.error('http.request.failed', {
        http: { method, path, durationMs },
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});