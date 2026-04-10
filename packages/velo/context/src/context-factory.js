import { generateRequestId } from '@velo/core';
import { randomUUID } from 'node:crypto';
// ── Shared defaults ────────────────────────────────────────────────────────────
const unauthenticatedContext = {
  isAuthenticated: false,
  getUser: async () => null,
};
function defaultLogger(id) {
  const prefix = `[${id}]`;
  return {
    info: (msg, meta) => console.info(prefix, msg, meta ?? ''),
    warn: (msg, meta) => console.warn(prefix, msg, meta ?? ''),
    error: (msg, meta) => console.error(prefix, msg, meta ?? ''),
    debug: (msg, meta) => console.debug(prefix, msg, meta ?? ''),
  };
}
/**
 * Creates an immutable `request` execution context for an HTTP request.
 * Called once per request at the runtime entry point, before `runWithContext()`.
 */
export function createRequestContext(options = {}) {
  const contextId = generateRequestId(options.headers ?? {});
  const loggerFactory = options.logger ?? defaultLogger;
  return Object.freeze({
    contextType: 'request',
    contextId,
    startedAt: new Date(),
    auth: options.auth ?? unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  });
}
/**
 * Creates a `job` execution context for scheduled/background jobs.
 * Called by the scheduler before running each registered job.
 */
export function createJobContext(options = {}) {
  const contextId = options.jobId ?? randomUUID();
  const loggerFactory = options.logger ?? defaultLogger;
  return Object.freeze({
    contextType: 'job',
    contextId,
    startedAt: new Date(),
    auth: unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  });
}
/**
 * Creates a `command` execution context for lumis CLI commands.
 * Called by the CLI runner before executing a command handler.
 */
export function createCommandContext(options = {}) {
  const contextId = options.commandId ?? randomUUID();
  const loggerFactory = options.logger ?? defaultLogger;
  return Object.freeze({
    contextType: 'command',
    contextId,
    startedAt: new Date(),
    auth: unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  });
}
/**
 * Creates a `test` execution context.
 * Prefer `withTestContext()` which wraps in a transaction and rolls back automatically.
 */
export function createTestContext(options = {}) {
  const contextId = options.testId ?? randomUUID();
  return Object.freeze({
    contextType: 'test',
    contextId,
    startedAt: new Date(),
    auth: unauthenticatedContext,
    logger: {
      info: () => {
        /* suppressed in test */
      },
      warn: () => {
        /* suppressed in test */
      },
      error: (msg, meta) => console.error(`[test][${contextId}]`, msg, meta ?? ''),
      debug: () => {
        /* suppressed in test */
      },
    },
    locale: options.locale ?? 'en',
    ...(options.db !== undefined && { db: options.db }),
  });
}
//# sourceMappingURL=context-factory.js.map
