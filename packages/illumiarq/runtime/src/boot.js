import { Hono } from 'hono';
import { getRegisteredRoutes, getMiddleware, composeMiddleware } from '@illumiarq/http';
import {
  authMiddleware as _auth,
  csrfMiddleware as _csrf,
  throttleMiddleware as _throttle,
  trazeMiddleware as _traze,
  setTrazeLogger,
} from '@illumiarq/http';
import { StubScheduler } from './stub-scheduler.js';
import { discoverModules } from './discovery/discover-modules.js';
import { initializeRuntimeLogger } from './logging/init-logger.js';
import { loadLoggingConfig } from './config/load-logging.js';
import { createRequestContext, runWithContext } from './context/index.js';
import { createContextLogger } from './logging/context-logger.js';

void _auth;
void _csrf;
void _throttle;
void _traze;
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

  // Initialize runtime logger from app config/logging.ts (or defaults)
  const loggingConfig = await loadLoggingConfig();
  const logger = initializeRuntimeLogger(loggingConfig);
  setTrazeLogger(logger);

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
    const baseHandler =
      typeof routeDef.handler === 'function'
        ? routeDef.handler
        : async () => new Response('Handler not a function', { status: 500 });

    const configuredMiddleware = routeDef.middleware ?? [];
    const routeMiddleware = configuredMiddleware.includes('lumiarq.traze')
      ? configuredMiddleware
      : ['lumiarq.traze', ...configuredMiddleware];

    const middlewareFns = routeMiddleware
      .map((mw) => {
        if (typeof mw === 'function') return mw;
        const def = getMiddleware(mw);
        if (!def) {
          console.warn(
            `[LumiARQ] Unknown middleware: "${mw}" on route ${routeDef.method} ${routeDef.path}`,
          );
          return undefined;
        }
        return def.handler;
      })
      .filter((fn) => fn !== undefined)
      .sort((a, b) => {
        const getPriority = (fn) => {
          const name = routeMiddleware.find(
            (mw) => typeof mw === 'string' && getMiddleware(mw)?.handler === fn,
          );
          return typeof name === 'string' ? (getMiddleware(name)?.priority ?? 0) : 0;
        };
        return getPriority(b) - getPriority(a);
      });

    const handler =
      middlewareFns.length > 0
        ? (req) => composeMiddleware(middlewareFns)(req, baseHandler)
        : baseHandler;

    const requestScopedHandler = async (input) => {
      const req = input instanceof Request ? input : input.req?.raw;
      if (!req) {
        return new Response('Invalid request context', { status: 500 });
      }

      const headersMap = {};
      req.headers.forEach((value, key) => {
        headersMap[key] = value;
      });

      const context = createRequestContext({
        headers: headersMap,
        logger: createContextLogger(logger),
      });

      return runWithContext(context, () => handler(req));
    };

    // Register the route on the Hono app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router[method](routeDef.path, requestScopedHandler);
  }

  const app = {
    router,
    modules,
    scheduler,
    logger,
  };

  if (hooks?.onError) {
    const onError = hooks.onError;
    router.onError((err, c) =>
      onError(err instanceof Error ? err : new Error(String(err)), c.req.raw),
    );
  }

  // Run post-boot hook if provided
  if (hooks?.afterBoot) {
    await hooks.afterBoot(app);
  }

  return app;
}
//# sourceMappingURL=boot.js.map
