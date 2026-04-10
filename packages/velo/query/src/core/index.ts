/**
 * @velo/query/core
 * Framework-agnostic loader bridge.
 * Works with plain fetch, SWR, Apollo, or any data-fetching library.
 * No TanStack dependency.
 */
export { fetchLoader } from './fetch-loader.js';
export { loaderStaleTime, createLoaderQueryOptions } from './stale-time.js';
export type { LoaderQueryOptions } from './stale-time.js';
