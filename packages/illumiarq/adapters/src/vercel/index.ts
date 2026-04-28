import type { LumiARQApp } from '@illumiarq/runtime';
import { handle } from 'hono/vercel';

/**
 * Creates a Vercel serverless function handler from a LumiARQ application.
 *
 * Accepts the `Promise<LumiARQApp>` returned by `boot()` directly.
 * Initialization is lazy — the app resolves on the first request so cold-start
 * time is correctly attributed to the first invocation, not the module parse.
 *
 * Pair with `export const config = { runtime: 'nodejs' }` in your entry file.
 *
 * @example
 * // bootstrap/vercel.ts  →  re-exported from  api/index.ts
 * import appPromise from '@/bootstrap/entry'
 * import { createVercelAdapter } from '@illumiarq/adapters/vercel'
 *
 * export const config = { runtime: 'nodejs' }
 * export default createVercelAdapter(appPromise)
 */
export function createVercelAdapter(
  app: LumiARQApp | Promise<LumiARQApp>,
): (req: Request) => Promise<Response> {
  let handler: ReturnType<typeof handle> | undefined;

  return async (req: Request): Promise<Response> => {
    if (!handler) {
      const resolved = await Promise.resolve(app);
      handler = handle(resolved.router);
    }
    return handler(req);
  };
}
