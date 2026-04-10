/**
 * @illumiarq/query — framework-agnostic loader bridge.
 * The main entry re-exports from the core (no framework binding).
 * For framework-specific adapters, import from:
 *   @illumiarq/query/react   — TanStack React Query
 *   @illumiarq/query/vue     — TanStack Vue Query
 *   @illumiarq/query/solid   — Solid Query
 *   @illumiarq/query/svelte  — Svelte readable store + TanStack Svelte Query
 */
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from './core/index.js';
export type { LoaderQueryOptions } from './core/index.js';
