export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
/**
 * Maps a framework-agnostic LoaderQueryOptions to
 * the shape expected by Solid Query's createQuery.
 */
export function toTanStackOptions(opts) {
  return {
    queryKey: opts.key,
    queryFn: opts.fetcher,
    staleTime: opts.staleTime,
  };
}
//# sourceMappingURL=index.js.map
