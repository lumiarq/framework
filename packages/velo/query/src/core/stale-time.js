import { fetchLoader } from './fetch-loader.js';
/**
 * Returns the staleTime value derived from the route's render strategy.
 *
 * LumiARQ staleTime encoding:
 *   SSG routes  → `Infinity`   (data is immutable at build time)
 *   ISR routes  → `N * 500`    (half of revalidate seconds, in ms)
 *   Dynamic     → `0`           (never cache client-side)
 *
 * @param routeStaleTime - staleTime from a ClassifiedRoute
 */
export function loaderStaleTime(routeStaleTime) {
  return routeStaleTime;
}
/**
 * Creates a framework-agnostic LoaderQueryOptions object.
 * Pass the result to a framework adapter (React, Vue, Solid) or use directly
 * with plain fetch / SWR / Apollo via `@velo/query/core`.
 *
 * @param key       - Unique cache key array
 * @param loader    - BoundLoader from defineLoader
 * @param input     - Input forwarded to loader.fetch
 * @param staleTime - Client staleTime from classifyRoute(route).staleTime
 */
export function createLoaderQueryOptions(key, loader, input, staleTime) {
  return {
    key,
    fetcher: fetchLoader(loader, input),
    staleTime: loaderStaleTime(staleTime),
  };
}
//# sourceMappingURL=stale-time.js.map
