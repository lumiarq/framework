import { Hono } from 'hono';
import { getRegisteredRoutes, getMiddleware, composeMiddleware } from '@velo/http';
import type { MiddlewareFn } from '@velo/http';
// Auto-registers all built-in framework middleware (lumiarq.auth, lumiarq.csrf, lumiarq.throttle)
// Side-effect import: runs defineMiddleware() calls inside each builtin file
import { authMiddleware as _auth, csrfMiddleware as _csrf, throttleMiddleware as _throttle } from '@velo/http';
import { StubScheduler } from './stub-scheduler.js';
import { discoverModules } from './discovery/discover-modules.js';
import type { LumiARQApp, BootHooks } from './types.js';

// Void the imports to suppress "unused variable" lint warnings — the import
// side-effect (registering into the global middleware registry) is all we need.
void _auth; void _csrf; void _throttle;

/**
 * Bootstraps the LumiARQ application.
 *
 * This is the main entry point called from `bootstrap/entry.ts`. It orchestrates:
 * 1. Hono app creation with all routes
 * 2. Module discovery and initialization
 * 3. Route registration from the Route facade registry
 * 4. Lifecycle hooks (beforeBoot, afterBoot)
 *
 * The returned `LumiARQApp` is then wrapped by the deployment adapter (Node, Cloudflare, Static).
 *
 * @param hooks - Optional lifecycle hooks for custom startup logic
 * @returns The initialized LumiARQApp ready for serving requests
 *
 * @example
 * // bootstrap/entry.ts
 * import { boot } from '@lumiarq/framework';
 * export default boot();
 *
 * @example
 * // With hooks
 * export default boot({
 *   async beforeBoot() {
 *     await featureFlags.connect(env.FEATURE_FLAG_KEY);
 *   },
 *   async afterBoot(app) {
 *     await cache.warm(app.scheduler);
 *   },
 * });
 */
export async function boot(hooks?: BootHooks): Promise<LumiARQApp> {
  // Initialize the Hono application
  const router = new Hono();

  // Initialize the scheduler
  const scheduler = new StubScheduler();

  // Run pre-discovery hook if provided
  if (hooks?.beforeBoot) {
    await hooks.beforeBoot();
  }

  // Discover and load modules
  // In production, this reads bootstrap/cache/modules.manifest.json
  // For now, the manifest is empty (only manually wired modules are used)
  const modules = await discoverModules(scheduler);

  // Register all routes from the Route facade registry
  // Routes are registered by route files calling Route.get/post/put/patch/delete()
  const routes = getRegisteredRoutes();

  for (const routeDef of routes) {
    if (!routeDef.method) {
      throw new Error(`Route definition missing method: ${routeDef.path}`);
    }

    const method = routeDef.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    const baseHandler =
      typeof routeDef.handler === 'function'
        ? routeDef.handler
        : async () => new Response('Handler not a function', { status: 500 });

    // Resolve middleware: string names → registry lookups, inline functions → direct use
    const middlewareFns: MiddlewareFn[] = (routeDef.middleware ?? [])
      .map((mw): MiddlewareFn | undefined => {
        if (typeof mw === 'function') return mw as MiddlewareFn;
        const def = getMiddleware(mw);
        if (!def) {
          console.warn(`[LumiARQ] Unknown middleware: "${mw}" on route ${routeDef.method} ${routeDef.path}`);
          return undefined;
        }
        return def.handler;
      })
      .filter((fn): fn is MiddlewareFn => fn !== undefined)
      // Sort by priority from MiddlewareDefinition (strings only; inline fns have no priority)
      .sort((a, b) => {
        const getPriority = (fn: MiddlewareFn) => {
          const name = (routeDef.middleware ?? []).find(
            (mw) => typeof mw === 'string' && getMiddleware(mw)?.handler === fn,
          );
          return typeof name === 'string' ? (getMiddleware(name)?.priority ?? 0) : 0;
        };
        return getPriority(b) - getPriority(a);
      });

    // Compose middleware pipeline → wrap base handler
    const handler =
      middlewareFns.length > 0
        ? (req: Request) => composeMiddleware(middlewareFns)(req, baseHandler as (req: Request) => Promise<Response>)
        : baseHandler;

    // Register the route on the Hono app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any)[method](routeDef.path, handler);
  }

  const app: LumiARQApp = {
    router,
    modules,
    scheduler,
  };

  // Run post-boot hook if provided
  if (hooks?.afterBoot) {
    await hooks.afterBoot(app);
  }

  return app;
}
