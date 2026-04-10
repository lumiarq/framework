import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
/**
 * Single ALS store for all execution context variants
 * (request, job, command, test).
 */
const contextStore = new AsyncLocalStorage();
/**
 * Stable ambient context set at application boot time.
 * Used as fallback by `getContext()` when called outside any ALS scope.
 * Set via `setApplicationContext()` during `boot()`.
 */
let applicationContext = null;
/**
 * Sets the stable application-level context used as fallback for `getContext()`.
 * Called once during application boot, before any requests are handled.
 *
 * @param ctx - A `command` context created by `createCommandContext()`
 */
export function setApplicationContext(ctx) {
  applicationContext = ctx;
}
/**
 * Builds a fresh ambient `command` context — returned by `getContext()` when
 * called outside any `runWithContext()` scope and no `applicationContext` is set.
 * A new instance per call keeps contextId and startedAt fresh.
 */
function buildAmbientContext() {
  const id = randomUUID();
  const prefix = `[${id}]`;
  return Object.freeze({
    contextType: 'command',
    contextId: id,
    startedAt: new Date(),
    auth: {
      isAuthenticated: false,
      getUser: async () => null,
    },
    logger: {
      info: (msg, meta) => console.info(prefix, msg, meta ?? ''),
      warn: (msg, meta) => console.warn(prefix, msg, meta ?? ''),
      error: (msg, meta) => console.error(prefix, msg, meta ?? ''),
      debug: (msg, meta) => console.debug(prefix, msg, meta ?? ''),
    },
    locale: 'en',
  });
}
/**
 * Wraps a handler/job/command in an isolated ALS scope.
 *
 * @param ctx - Execution context to bind (created by a context factory)
 * @param fn  - Function to execute within the isolated scope
 * @returns   The return value of fn
 *
 * @example
 * const ctx = createRequestContext({ headers: req.headers });
 * return runWithContext(ctx, () => handleRequest(req));
 */
export function runWithContext(ctx, fn) {
  return contextStore.run(ctx, fn);
}
/**
 * Returns the current execution context.
 *
 * Never throws — resolution order:
 * 1. Active ALS scope (set by `runWithContext()`)
 * 2. Application context (set by `setApplicationContext()` at boot)
 * 3. Fresh ambient `command` context (fallback for bare scripts / CLI)
 *
 * Use `ctx.contextType` to discriminate the lifecycle variant.
 *
 * @example
 * const ctx = getContext();
 * if (ctx.contextType === 'request') {
 *   const user = await ctx.auth.getUser();
 * }
 */
export function getContext() {
  return contextStore.getStore() ?? applicationContext ?? buildAmbientContext();
}
//# sourceMappingURL=async-local-storage.js.map
