import type { Hono } from 'hono';
import type { ModuleDefinition } from '@illumiarq/modules';
import type { SchedulerContract } from '@illumiarq/contracts';

export interface RuntimeLogger {
  debug: (message: string, context?: Record<string, unknown>) => Promise<void>;
  info: (message: string, context?: Record<string, unknown>) => Promise<void>;
  warn: (message: string, context?: Record<string, unknown>) => Promise<void>;
  error: (message: string, context?: Record<string, unknown>) => Promise<void>;
}

/**
 * The result of calling `boot()` — a fully initialized LumiARQ application.
 *
 * The framework returns this shape; adapters wrap it into their runtime-specific
 * shapes (Node HTTP server, Cloudflare fetch handler, static prerender pipeline, etc).
 */
export interface LumiARQApp {
  /** The final Hono router with all modules, routes, and middleware bound. */
  router: Hono;
  /** Registry of all discovered and loaded modules. */
  modules: Map<string, ModuleDefinition>;
  /** The scheduler instance for job registration and execution. */
  scheduler: SchedulerContract;
  /** Framework logger used by built-in tracing middleware and runtime hooks. */
  logger?: RuntimeLogger;
}

/** Optional lifecycle hooks passed to `boot()` for custom startup logic. */
export interface BootHooks {
  /**
   * Runs after providers are initialized but before module discovery.
   * Useful for connecting external services or loading feature flags.
   */
  beforeBoot?: () => Promise<void>;
  /**
   * Runs after all modules, routes, and middleware are registered.
   * Useful for warming caches or running startup checks.
   */
  afterBoot?: (app: LumiARQApp) => Promise<void>;
  /**
   * Global error handler invoked for any unhandled error thrown by a route
   * handler or middleware that is not caught elsewhere.
   *
   * In development this is a good place to plug in `@trazze/ignite`:
   * ```ts
   * import { handleIgnitionError } from '@trazze/ignite';
   * export default boot({ onError: handleIgnitionError });
   * ```
   */
  onError?: (err: Error, req: Request) => Promise<Response>;
}
