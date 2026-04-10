import type { Hono } from 'hono';
import type { ModuleDefinition } from '@velo/modules';
import type { SchedulerContract } from '@velo/contracts';

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
}
