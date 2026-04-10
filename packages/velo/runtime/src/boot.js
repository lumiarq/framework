import { Hono } from 'hono';
import { getRegisteredRoutes } from '@velo/http';
import { StubScheduler } from './stub-scheduler.js';
import { discoverModules } from './discovery/discover-modules.js';
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
export async function boot(hooks) {
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
    const method = routeDef.method.toLowerCase();
    const handler =
      typeof routeDef.handler === 'function'
        ? routeDef.handler
        : async () => new Response('Handler not a function', { status: 500 });
    // Register the route on the Hono app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router[method](routeDef.path, handler);
  }
  const app = {
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
//# sourceMappingURL=boot.js.map
