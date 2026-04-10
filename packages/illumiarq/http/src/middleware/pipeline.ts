/**
 * Middleware pipeline — composes an ordered list of middleware into a single dispatcher.
 *
 * Execution order is FIFO: first middleware registered runs first.
 * Each middleware receives the request and a `next()` function.
 * Calling `next()` passes control to the next middleware or the final handler.
 */

import type { MiddlewareFn } from '../types/http.types.js';

/**
 * Composes an ordered list of middleware into a single function.
 *
 * @param middlewares - Ordered list of middleware functions
 * @returns A composed function: (req, handler) → Response
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
