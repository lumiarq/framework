import { headersToRecord } from '@illumiarq/core';
import { Hono } from 'hono';
import { getRegisteredRoutes, getMiddleware, composeMiddleware } from '@illumiarq/http';
import type { MiddlewareFn } from '@illumiarq/http';
// Auto-registers all built-in framework middleware (lumiarq.auth, lumiarq.csrf, lumiarq.throttle)
// Side-effect import: runs defineMiddleware() calls inside each builtin file
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
import type { LumiARQApp, BootHooks } from './types.js';

// Void the imports to suppress "unused variable" lint warnings — the import
// side-effect (registering into the global middleware registry) is all we need.
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
export async function boot(hooks?: BootHooks): Promise<LumiARQApp> {
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

    const method = routeDef.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    const baseHandler =
      typeof routeDef.handler === 'function'
        ? routeDef.handler
        : async () => new Response('Handler not a function', { status: 500 });

    // Resolve middleware: string names → registry lookups, inline functions → direct use
    const configuredMiddleware = routeDef.middleware ?? [];
    const routeMiddleware = configuredMiddleware.includes('lumiarq.traze')
      ? configuredMiddleware
      : ['lumiarq.traze', ...configuredMiddleware];

    const middlewareFns: MiddlewareFn[] = routeMiddleware
      .map((mw): MiddlewareFn | undefined => {
        if (typeof mw === 'function') return mw as MiddlewareFn;

        // Handle parameterized throttle: 'lumiarq.throttle:<maxReqs>,<windowMin>'
        // e.g. 'lumiarq.throttle:5,1' → max 5 requests per 1-minute window
        if (typeof mw === 'string' && mw.startsWith('lumiarq.throttle:')) {
          const params = mw.slice('lumiarq.throttle:'.length).split(',');
          const maxReqs = parseInt(params[0] ?? '60', 10);
          const windowMin = parseFloat(params[1] ?? '1');
          const windowMs = Math.round(windowMin * 60_000);
          const routeStore = new Map<string, { count: number; resetAt: number }>();
          return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
            const ip =
              req.headers.get('CF-Connecting-IP') ??
              req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
              req.headers.get('X-Real-IP') ??
              'unknown';
            const now = Date.now();
            const entry = routeStore.get(ip);
            if (!entry || now >= entry.resetAt) {
              routeStore.set(ip, { count: 1, resetAt: now + windowMs });
              return next();
            }
            if (entry.count >= maxReqs) {
              const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
              return new Response(
                JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded.' }),
                {
                  status: 429,
                  headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(maxReqs),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
                  },
                },
              );
            }
            entry.count++;
            return next();
          };
        }

        const def = getMiddleware(mw);
        if (!def) {
          console.warn(
            `[LumiARQ] Unknown middleware: "${mw}" on route ${routeDef.method} ${routeDef.path}`,
          );
          return undefined;
        }
        return def.handler;
      })
      .filter((fn): fn is MiddlewareFn => fn !== undefined)
      // Sort by priority from MiddlewareDefinition (strings only; inline fns have no priority)
      .sort((a, b) => {
        const getPriority = (fn: MiddlewareFn) => {
          const name = routeMiddleware.find(
            (mw) => typeof mw === 'string' && getMiddleware(mw)?.handler === fn,
          );
          return typeof name === 'string' ? (getMiddleware(name)?.priority ?? 0) : 0;
        };
        return getPriority(b) - getPriority(a);
      });

    // Compose middleware pipeline → wrap base handler
    let handler: (ctx: any) => Promise<Response>;

    if (middlewareFns.length > 0) {
      handler = async (ctx: any) => {
        const req = ctx.req.raw;
        // Create a wrapped handler that passes the Hono context to the baseHandler
        const wrappedHandler = async () => baseHandler(ctx);
        // Execute middleware pipeline with raw request, but the final handler gets the context
        return composeMiddleware(middlewareFns)(
          req,
          wrappedHandler as (req: Request) => Promise<Response>,
        );
      };
    } else {
      handler = baseHandler as (ctx: any) => Promise<Response>;
    }

    // Inject Deprecation / Sunset headers for deprecated routes
    if (routeDef.deprecated) {
      const innerHandler = handler;
      handler = async (ctx: any) => {
        const response = await innerHandler(ctx);
        const headers = new Headers(response.headers);
        headers.set('Deprecation', 'true');
        if (routeDef.sunset) {
          headers.set('Sunset', routeDef.sunset);
        }
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      };
    }

    const requestScopedHandler = async (honoCtx: any) => {
      const req = honoCtx.req.raw;
      if (!req) {
        return new Response('Invalid request context', { status: 500 });
      }

      const headersMap = headersToRecord(
        req.headers as Headers | Record<string, string | string[] | undefined>,
      );

      const context = createRequestContext({
        headers: headersMap,
        logger: createContextLogger(logger),
      });

      try {
        return await runWithContext(context, () => handler(honoCtx));
      } catch (err) {
        if (hooks?.onError) {
          await hooks.onError(err instanceof Error ? err : new Error(String(err)), req);
        }
        throw err;
      }
    };

    // Register the route on the Hono app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any)[method](routeDef.path, requestScopedHandler);
  }

  const app: LumiARQApp = {
    router,
    modules,
    scheduler,
    logger,
  };

  // Run post-boot hook if provided
  if (hooks?.afterBoot) {
    await hooks.afterBoot(app);
  }

  return app;
}
