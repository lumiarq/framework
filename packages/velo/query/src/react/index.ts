/**
 * @velo/query/react
 * TanStack React Query adapter for LumiARQ Loaders.
 * Requires @tanstack/react-query >= 5.0.0 as a peer dependency.
 */
import type { BoundLoader } from '@velo/http';
import type { LoaderQueryOptions } from '../core/stale-time.js';
import { fetchLoader } from '../core/fetch-loader.js';
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
export type { LoaderQueryOptions } from '../core/stale-time.js';

/**
 * Maps a framework-agnostic LoaderQueryOptions to
 * the shape expected by TanStack React Query's useQuery / QueryClient.
 *
 * @example
 * import { createLoaderQueryOptions, toTanStackOptions } from '@velo/query/react';
 *
 * const coreOpts = createLoaderQueryOptions(['post', slug], PostLoader, { slug }, staleTime);
 * const { data } = useQuery(toTanStackOptions(coreOpts));
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

/**
 * Convenience wrapper: creates TanStack Query options directly from a loader.
 * Equivalent to `toTanStackOptions(createLoaderQueryOptions(key, loader, input, 0))`.
 *
 * @example
 * const { data } = useQuery(createLoaderQuery(['post', slug], PostLoader, { slug }));
 */
export function createLoaderQuery(
  key: readonly unknown[],
  loader: BoundLoader,
  input: unknown,
): { queryKey: readonly unknown[]; queryFn: () => Promise<unknown> } {
  return {
    queryKey: key,
    queryFn: fetchLoader(loader, input),
  };
}
