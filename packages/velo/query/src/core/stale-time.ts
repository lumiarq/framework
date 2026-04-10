import type { BoundLoader } from '@velo/http';
import { fetchLoader } from './fetch-loader.js';

/**
 * Framework-agnostic query options for a LumiARQ Loader.
 * Adapters (React, Vue, Solid) map this to their library-specific shapes.
 */
export interface LoaderQueryOptions {
  /** Cache key — unique per loader + input combination */
  key: readonly unknown[];
  /** Async thunk that fetches the data */
  fetcher: () => Promise<unknown>;
  /** Client cache stale time in ms — derived from route strategy */
  staleTime: number;
}

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
export function loaderStaleTime(routeStaleTime: number): number {
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
export function createLoaderQueryOptions(
  key: readonly unknown[],
  loader: BoundLoader,
  input: unknown,
  staleTime: number,
): LoaderQueryOptions {
  return {
    key,
    fetcher: fetchLoader(loader, input),
    staleTime: loaderStaleTime(staleTime),
  };
}
