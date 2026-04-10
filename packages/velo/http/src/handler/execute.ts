/**
 * Handler execution pipeline.
 *
 * Orchestrates: validate input → execute handler → return response.
 * The handler receives a context object (e.g. Hono's Context) and returns a Response.
 */

import type { HandlerType } from './types.js';
import type { MiddlewareFn } from '../types/http.types.js';
import { composeMiddleware } from '../middleware/pipeline.js';

export interface ExecuteHandlerOptions {
  /** The handler to execute. */
  handler: HandlerType;
  /** Middleware to run before the handler. */
  middleware?: MiddlewareFn[];
}

/**
 * Creates a composed request handler that runs middleware then the handler.
 *
 * @param options - Handler and optional middleware
 * @returns A function that accepts a Request and returns a Response
 */
export function createRequestHandler(
  options: ExecuteHandlerOptions,
): (req: Request) => Promise<Response> {
  const { handler, middleware = [] } = options;

  const composed = composeMiddleware(middleware);

  return (req: Request) =>
    composed(req, async (request: Request) => {
      const result = await handler(request);
      if (result instanceof Response) return result;
      // If handler returns a non-Response, wrap as JSON
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
}
