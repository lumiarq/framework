/**
 * @velo/query/svelte
 * Svelte store adapter for LumiARQ Loaders.
 *
 * Provides `useLoader` — a Svelte-idiomatic readable store that loads data
 * from a LumiARQ BoundLoader and exposes reactive loading/error state.
 *
 * No hard dependency on svelte/store. The store interface is implemented
 * locally so this package compiles without Svelte installed, matching the
 * same optional-peer pattern used by /react, /vue, and /solid bridges.
 *
 * For TanStack Svelte Query integration use `toTanStackOptions` with
 * @tanstack/svelte-query's `createQuery` helper.
 */
import type { BoundLoader } from '@velo/http';
import type { LoaderQueryOptions } from '../core/stale-time.js';
import { fetchLoader } from '../core/fetch-loader.js';
export { fetchLoader, loaderStaleTime, createLoaderQueryOptions } from '../core/index.js';
export type { LoaderQueryOptions } from '../core/stale-time.js';

// ---------------------------------------------------------------------------
// Minimal Svelte-store-compatible subscriber type
// ---------------------------------------------------------------------------

/** Unsubscribe function returned by store.subscribe(). */
export type Unsubscriber = () => void;

/** A Svelte-compatible readable store. */
export interface Readable<T> {
  subscribe(run: (value: T) => void): Unsubscriber;
}

/** State shape emitted by a loader store. */
export interface LoaderState<T = unknown> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

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
function readable<T>(
  initialValue: T,
  start: (set: (value: T) => void) => void | (() => void),
): Readable<T> {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  function set(newValue: T): void {
    value = newValue;
    for (const sub of subscribers) sub(value);
  }

  let stop: undefined | (() => void);

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
 * import { useLoader } from '@velo/query/svelte';
 * import { PostLoader } from '@/modules/Blog/loaders/post.loader';
 *
 * const post$ = useLoader(['post', slug], PostLoader, { slug });
 *
 * // In template: {#if $post$.loading} ... {:else if $post$.error} ... {/if}
 */
export function useLoader<T = unknown>(
  key: readonly unknown[],
  loader: BoundLoader,
  input: unknown,
): Readable<LoaderState<T>> {
  void key; // reserved for future caching / keyed-invalidation
  const fetcher = fetchLoader(loader, input);

  return readable<LoaderState<T>>({ data: undefined, loading: true, error: undefined }, (set) => {
    fetcher()
      .then((data) => set({ data: data as T, loading: false, error: undefined }))
      .catch((err: unknown) =>
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
 * import { createLoaderQueryOptions, toTanStackOptions } from '@velo/query/svelte';
 * import { createQuery } from '@tanstack/svelte-query';
 *
 * const opts  = createLoaderQueryOptions(['post', slug], PostLoader, { slug }, staleTime);
 * const query = createQuery(toTanStackOptions(opts));
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
