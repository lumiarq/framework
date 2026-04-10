/**
 * @velo/query — framework-agnostic loader bridge.
 * The main entry re-exports from the core (no framework binding).
 * For framework-specific adapters, import from:
 *   @velo/query/react   — TanStack React Query
 *   @velo/query/vue     — TanStack Vue Query
 *   @velo/query/solid   — Solid Query
 *   @velo/query/svelte  — Svelte readable store + TanStack Svelte Query
 */
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from './core/index.js';
export type { LoaderQueryOptions } from './core/index.js';
