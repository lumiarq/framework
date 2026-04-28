import type { LumiARQApp } from '@illumiarq/runtime';

/**
 * Creates a Web-standard `{ fetch }` export from a LumiARQ application.
 *
 * Use this adapter for any runtime that consumes a Web-standard fetch handler:
 * - **Bun** — `export default createFetchAdapter(appPromise)`
 * - **Deno Deploy** — `Deno.serve(createFetchAdapter(appPromise).fetch)`
 * - **AWS Lambda function URLs** — `export default createFetchAdapter(appPromise)`
 * - **WinterCG-compatible runtimes** — any runtime supporting the Fetch spec
 *
 * Initialization is lazy — the app resolves on the first request.
 *
 * @example
 * // bootstrap/worker.bun.ts
 * import appPromise from '@/bootstrap/entry'
 * import { createFetchAdapter } from '@illumiarq/adapters/fetch'
 * export default createFetchAdapter(appPromise)
 *
 * @example
 * // bootstrap/worker.deno.ts
 * import appPromise from '@/bootstrap/entry'
 * import { createFetchAdapter } from '@illumiarq/adapters/fetch'
 * const { fetch } = createFetchAdapter(appPromise)
 * Deno.serve(fetch)
 */
export function createFetchAdapter(app: LumiARQApp | Promise<LumiARQApp>): {
  fetch: (req: Request) => Promise<Response>;
} {
  let router: LumiARQApp['router'] | undefined;

  const fetch = async (req: Request): Promise<Response> => {
    if (!router) {
      const resolved = await Promise.resolve(app);
      router = resolved.router;
    }
    return router.fetch(req);
  };

  return { fetch };
}
