import { fetchLoader } from '../core/fetch-loader.js';
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
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
export function toTanStackOptions(opts) {
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
export function createLoaderQuery(key, loader, input) {
  return {
    queryKey: key,
    queryFn: fetchLoader(loader, input),
  };
}
//# sourceMappingURL=index.js.map
