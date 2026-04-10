import { fetchLoader } from '../core/fetch-loader.js';
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
// ---------------------------------------------------------------------------
// Minimal readable() implementation (no svelte/store dependency)
// ---------------------------------------------------------------------------
/**
 * Creates a minimal Svelte-compatible readable store without importing
 * from svelte/store, so this module works in non-Svelte environments.
 *
 * If the consuming app already has Svelte installed, replace this with
 * `readable` from 'svelte/store' — the interface is identical.
 */
function readable(initialValue, start) {
  let value = initialValue;
  const subscribers = new Set();
  function set(newValue) {
    value = newValue;
    for (const sub of subscribers) sub(value);
  }
  let stop;
  return {
    subscribe(run) {
      subscribers.add(run);
      if (subscribers.size === 1) {
        const cleanup = start(set);
        stop = typeof cleanup === 'function' ? cleanup : undefined;
      }
      run(value);
      return () => {
        subscribers.delete(run);
        if (subscribers.size === 0 && typeof stop === 'function') {
          stop();
          stop = undefined;
        }
      };
    },
  };
}
// ---------------------------------------------------------------------------
// useLoader
// ---------------------------------------------------------------------------
/**
 * Creates a Svelte readable store that fetches data from a LumiARQ BoundLoader.
 *
 * The store immediately enters `{ loading: true, data: undefined, error: undefined }`
 * and resolves to `{ loading: false, data, error: undefined }` on success, or
 * `{ loading: false, data: undefined, error }` on failure.
 *
 * @param key     - Unique cache-key array (used for identity, not caching here)
 * @param loader  - BoundLoader returned by defineLoader
 * @param input   - Input forwarded to loader.fetch
 *
 * @example
 * // In a Svelte component
 * import { useLoader } from '@illumiarqquery/svelte';
 * import { PostLoader } from '@/modules/Blog/loaders/post.loader';
 *
 * const post$ = useLoader(['post', slug], PostLoader, { slug });
 *
 * // In template: {#if $post$.loading} ... {:else if $post$.error} ... {/if}
 */
export function useLoader(key, loader, input) {
  void key; // reserved for future caching / keyed-invalidation
  const fetcher = fetchLoader(loader, input);
  return readable({ data: undefined, loading: true, error: undefined }, (set) => {
    fetcher()
      .then((data) => set({ data: data, loading: false, error: undefined }))
      .catch((err) =>
        set({
          data: undefined,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      );
  });
}
// ---------------------------------------------------------------------------
// toTanStackOptions — for @tanstack/svelte-query integration
// ---------------------------------------------------------------------------
/**
 * Maps a framework-agnostic LoaderQueryOptions to the shape expected by
 * TanStack Svelte Query's `createQuery`.
 *
 * @example
 * import { createLoaderQueryOptions, toTanStackOptions } from '@illumiarqquery/svelte';
 * import { createQuery } from '@tanstack/svelte-query';
 *
 * const opts  = createLoaderQueryOptions(['post', slug], PostLoader, { slug }, staleTime);
 * const query = createQuery(toTanStackOptions(opts));
 */
export function toTanStackOptions(opts) {
  return {
    queryKey: opts.key,
    queryFn: opts.fetcher,
    staleTime: opts.staleTime,
  };
}
//# sourceMappingURL=index.js.map
