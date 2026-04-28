import type { LumiARQApp } from '@illumiarq/runtime';

export interface CloudflareAdapterOptions {
  /**
   * Called when an unhandled error escapes the router.
   * Default: returns a plain 500 response.
   */
  onError?: (err: unknown) => Response | Promise<Response>;
}

/**
 * Creates a Cloudflare Workers-compatible export from a LumiARQ application.
 *
 * Accepts the `Promise<LumiARQApp>` returned by `boot()` directly.
 * Initialization is lazy — the app is resolved on the first request.
 *
 * @example
 * // bootstrap/worker.ts
 * import appPromise from '@/bootstrap/entry'
 * import { createCloudflareAdapter } from '@illumiarq/adapters/cloudflare'
 * export default createCloudflareAdapter(appPromise)
 */
export function createCloudflareAdapter(
  app: LumiARQApp | Promise<LumiARQApp>,
  options: CloudflareAdapterOptions = {},
): { fetch: (req: Request) => Promise<Response> } {
  let router: LumiARQApp['router'] | undefined;

  const fetch = async (req: Request): Promise<Response> => {
    if (!router) {
      const resolved = await Promise.resolve(app);
      router = resolved.router;
    }
    try {
      return await router.fetch(req);
    } catch (err) {
      if (options.onError) return options.onError(err);
      console.error('[lumiarq/cloudflare] Unhandled error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  };

  return { fetch };
}
