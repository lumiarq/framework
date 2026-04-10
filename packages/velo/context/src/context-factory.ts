import { generateRequestId } from '@velo/core';
import { randomUUID } from 'node:crypto';
import type { ExecutionContext, AuthContext, RequestLogger } from './types.js';

// ── Shared defaults ────────────────────────────────────────────────────────────

const unauthenticatedContext: AuthContext = {
  isAuthenticated: false,
  getUser: async () => null,
};

function defaultLogger(id: string): RequestLogger {
  const prefix = `[${id}]`;
  return {
    info: (msg, meta) => console.info(prefix, msg, meta ?? ''),
    warn: (msg, meta) => console.warn(prefix, msg, meta ?? ''),
    error: (msg, meta) => console.error(prefix, msg, meta ?? ''),
    debug: (msg, meta) => console.debug(prefix, msg, meta ?? ''),
  };
}

// ── Request context ────────────────────────────────────────────────────────────

export interface CreateRequestContextOptions {
  headers?: Record<string, string | undefined>;
  auth?: AuthContext;
  logger?: (contextId: string) => RequestLogger;
  locale?: string;
}

/**
 * Creates an immutable `request` execution context for an HTTP request.
 * Called once per request at the runtime entry point, before `runWithContext()`.
 */
export function createRequestContext(options: CreateRequestContextOptions = {}): ExecutionContext {
  const contextId = generateRequestId(options.headers ?? {});
  const loggerFactory = options.logger ?? defaultLogger;

  return Object.freeze({
    contextType: 'request' as const,
    contextId,
    startedAt: new Date(),
    auth: options.auth ?? unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  } satisfies ExecutionContext);
}

// ── Job context ────────────────────────────────────────────────────────────────

export interface CreateJobContextOptions {
  jobId?: string;
  logger?: (contextId: string) => RequestLogger;
  locale?: string;
}

/**
 * Creates a `job` execution context for scheduled/background jobs.
 * Called by the scheduler before running each registered job.
 */
export function createJobContext(options: CreateJobContextOptions = {}): ExecutionContext {
  const contextId = options.jobId ?? randomUUID();
  const loggerFactory = options.logger ?? defaultLogger;

  return Object.freeze({
    contextType: 'job' as const,
    contextId,
    startedAt: new Date(),
    auth: unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  } satisfies ExecutionContext);
}

// ── Command context ────────────────────────────────────────────────────────────

export interface CreateCommandContextOptions {
  commandId?: string;
  logger?: (contextId: string) => RequestLogger;
  locale?: string;
}

/**
 * Creates a `command` execution context for lumis CLI commands.
 * Called by the CLI runner before executing a command handler.
 */
export function createCommandContext(options: CreateCommandContextOptions = {}): ExecutionContext {
  const contextId = options.commandId ?? randomUUID();
  const loggerFactory = options.logger ?? defaultLogger;

  return Object.freeze({
    contextType: 'command' as const,
    contextId,
    startedAt: new Date(),
    auth: unauthenticatedContext,
    logger: loggerFactory(contextId),
    locale: options.locale ?? 'en',
  } satisfies ExecutionContext);
}

// ── Test context ───────────────────────────────────────────────────────────────

export interface CreateTestContextOptions {
  testId?: string;
  locale?: string;
  db?: Record<string, unknown>;
}

/**
 * Creates a `test` execution context.
 * Prefer `withTestContext()` which wraps in a transaction and rolls back automatically.
 */
export function createTestContext(options: CreateTestContextOptions = {}): ExecutionContext {
  const contextId = options.testId ?? randomUUID();

  return Object.freeze({
    contextType: 'test' as const,
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
  } satisfies ExecutionContext);
}
