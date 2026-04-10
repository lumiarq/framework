/**
 * Core HTTP types used across the @illumiarq/http package.
 */

export type {
  HandlerType,
  MetaData,
  RenderMode,
  WebRouteOptions,
  ApiRouteOptions,
} from '../router/types.js';
export type { RouteDefinition } from '../router/define-route.js';
export type { BoundLoader, SitemapEntry } from '../loader/types.js';

// ── Middleware ────────────────────────────────────────────────────────────────

/** A middleware function that wraps a request/response cycle. */
export type MiddlewareFn = (req: Request, next: () => Promise<Response>) => Promise<Response>;

/** Named middleware definition returned by defineMiddleware(). */
export interface MiddlewareDefinition {
  name: string;
  handler: MiddlewareFn;
  /** Higher priority runs earlier. Default: 0 */
  priority?: number;
}

/**
 * A middleware value accepted in route and group definitions.
 *
 * - `string` — resolved by name from the global middleware registry (e.g. `'lumiarq.auth'`)
 * - `MiddlewareFn` — an inline function applied directly without registry lookup
 *
 * @example
 * Route.get('/dashboard', handler, { middleware: ['lumiarq.auth'] })
 * Route.get('/echo', handler, { middleware: [myInlineFn] })
 * Route.get('/secure', handler, { middleware: ['lumiarq.auth', myInlineFn] })
 */
export type MiddlewareInput = string | MiddlewareFn;

// ── Request helpers ──────────────────────────────────────────────────────────

export interface ParsedQuery {
  [key: string]: string | string[] | undefined;
}

export interface ParsedParams {
  [key: string]: string;
}

// ── Response helpers ─────────────────────────────────────────────────────────

export interface RedirectOptions {
  /** HTTP status code for the redirect. Default: 302 */
  status?: 301 | 302 | 303 | 307 | 308;
  /** Additional headers to include in the redirect response. */
  headers?: Record<string, string>;
}

export interface JsonOptions {
  /** HTTP status code. Default: 200 */
  status?: number;
  /** Additional headers to include. */
  headers?: Record<string, string>;
}

// ── Route matching ───────────────────────────────────────────────────────────

export interface RouteMatch {
  /** Whether the path matched the pattern. */
  matched: boolean;
  /** Extracted parameter values from the path. */
  params: Record<string, string>;
}
