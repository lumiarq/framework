import { LumiARQError } from './lumiarq-error.js';

/**
 * Thrown when `getRequestContext()` is called outside of a request lifecycle.
 *
 * This happens when code that depends on AsyncLocalStorage is invoked
 * during module initialisation, from a background process, or in tests
 * that don't call `runWithContext()`. It indicates an architectural error:
 * the caller has a hidden runtime dependency on the request context.
 *
 * `getRequestContext()` MUST throw this error outside the lifecycle.
 *
 * @see getRequestContext in @velo/runtime
 *
 * @example
 * // In a service that's accidentally used at module load time:
 * // MissingContextError: getRequestContext() called outside a request lifecycle
 */
export class MissingContextError extends LumiARQError {
  override readonly name = 'MissingContextError';

  constructor(message = 'getRequestContext() called outside a request lifecycle') {
    super(message);
  }
}
