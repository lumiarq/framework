/**
 * defineExceptionHandler() — application-level exception handler.
 *
 * Replaces Hono's default `onError` in boot.ts. Pass the result to `boot()` via
 * the `onError` hook.
 *
 * Standard error classes are also exported so handlers can throw typed errors
 * that the exception handler knows how to format.
 *
 * @example
 * // bootstrap/entry.ts
 * import { boot, defineExceptionHandler } from '@lumiarq/framework';
 *
 * const exceptionHandler = defineExceptionHandler({
 *   render(error, req) {
 *     if (error instanceof NotFoundError) {
 *       return new Response(JSON.stringify({ message: error.message }), { status: 404 });
 *     }
 *     return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
 *   },
 * });
 *
 * export default boot({ onError: exceptionHandler });
 */

/** Base class for all LumiARQ HTTP errors. */
export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toResponse(): Response {
    return new Response(JSON.stringify({ message: this.message, ...(this.context ?? {}) }), {
      status: this.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export class ValidationError extends HttpException {
  constructor(
    public readonly errors: Record<string, string[]>,
    message = 'Validation failed.',
  ) {
    super(422, message, { errors });
  }
}

export class NotFoundError extends HttpException {
  constructor(message = 'Not found.') {
    super(404, message);
  }
}

export class UnauthorizedError extends HttpException {
  constructor(message = 'Unauthorized.') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpException {
  constructor(message = 'Forbidden.') {
    super(403, message);
  }
}

export class BadRequestError extends HttpException {
  constructor(message = 'Bad request.') {
    super(400, message);
  }
}

export class ConflictError extends HttpException {
  constructor(message = 'Conflict.') {
    super(409, message);
  }
}

export type ExceptionHandlerFn = (error: Error, req: Request) => Response | Promise<Response>;

export interface ExceptionHandlerDefinition {
  render: ExceptionHandlerFn;
}

/**
 * Creates a typed exception handler.
 *
 * The returned function can be passed directly to `boot({ onError: ... })`.
 * `HttpException` subclasses are automatically converted to their `toResponse()` value
 * unless your `render()` function handles them first.
 */
export function defineExceptionHandler(definition: ExceptionHandlerDefinition): ExceptionHandlerFn {
  return async (error: Error, req: Request): Promise<Response> => {
    try {
      const response = await definition.render(error, req);
      return response;
    } catch {
      // Fallback: if the render function itself throws, return the HttpException response
      // or a generic 500.
      if (error instanceof HttpException) {
        return error.toResponse();
      }
      return new Response(JSON.stringify({ message: 'Internal server error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
