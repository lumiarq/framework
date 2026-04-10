/**
 * @velo/query/solid
 * Solid Query adapter for LumiARQ Loaders.
 * Requires @tanstack/solid-query >= 5.0.0 as a peer dependency.
 */
import type { LoaderQueryOptions } from '../core/stale-time.js';
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
export type { LoaderQueryOptions } from '../core/stale-time.js';

/**
 * Maps a framework-agnostic LoaderQueryOptions to
 * the shape expected by Solid Query's createQuery.
 */
export function toTanStackOptions(opts: LoaderQueryOptions): {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  staleTime: number;
} {
  return {
    queryKey: opts.key,
    queryFn: opts.fetcher,
    staleTime: opts.staleTime,
  };
}
