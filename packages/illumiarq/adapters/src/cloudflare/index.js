/**
 * Returns a Cloudflare Workers-compatible export object from a Hono app.
 * Assign the return value to `export default` in your Worker entry point.
 *
 * @example
 * // entrypoints/worker.ts
 * import { app } from '@/bootstrap/app'
 * export default buildCloudflareAdapter(app)
 */
export function buildCloudflareAdapter(app) {
  return { fetch: app.fetch.bind(app) };
}
//# sourceMappingURL=index.js.map
