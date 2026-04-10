/**
 * Request lifecycle — the complete server-side execution path for a single request.
 *
 * Orchestrates:
 * 1. Context creation (createRequestContext → runWithContext)
 * 2. Middleware pipeline (security headers, request ID, CORS, rate limit, Cache-Control)
 * 3. Handler execution
 *
 * The loader orchestration and meta() run inside the handler itself, after the
 * middleware pipeline has prepared the request context.
 */
import { createRequestContext, runWithContext } from './context/index.js';
import {
  composeMiddleware,
  securityHeadersMiddleware,
  requestIdMiddleware,
  cacheControlMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
} from './middleware-pipeline.js';
/**
 * Full request lifecycle entry point.
 *
 * Wraps the handler in the standard middleware stack and runs everything
 * inside a request-scoped AsyncLocalStorage context.
 *
 * @param req     - The incoming web-standard Request
 * @param handler - The route handler (receives the original Request)
 * @param opts    - Pipeline configuration (route, cors, rateLimit, context)
 */
export async function handleRequest(req, handler, opts = {}) {
  const route = opts.route ?? { render: 'dynamic' };
  const middlewares = [
    securityHeadersMiddleware(),
    requestIdMiddleware(),
    ...(opts.rateLimit ? [rateLimitMiddleware(opts.rateLimit)] : []),
    ...(opts.cors ? [corsMiddleware(opts.cors)] : []),
    cacheControlMiddleware(route),
  ];
  const dispatch = composeMiddleware(middlewares);
  // Create the request context scoped to this request's headers.
  const headersMap = {};
  req.headers.forEach((value, key) => {
    headersMap[key] = value;
  });
  const ctx = createRequestContext({ ...opts.context, headers: headersMap });
  return runWithContext(ctx, () => dispatch(req, handler));
}
//# sourceMappingURL=request-lifecycle.js.map
