/**
 * content-cache — Singleton in-memory cache for parsed ContentPage arrays.
 *
 * Populated once on first access per directory. The cache is keyed by the
 * absolute directory path so multiple defineContentLoader() instances
 * (different directories) coexist without collision.
 *
 * Call clearCache() in tests to reset between runs.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _cache = new Map<string, any[]>();

/** Retrieve cached pages for the given directory, or undefined if not yet loaded. */
export function getCached<T>(directory: string): T[] | undefined {
  return _cache.get(directory) as T[] | undefined;
}

/** Store parsed pages for a directory. */
export function setCached<T>(directory: string, pages: T[]): void {
  _cache.set(directory, pages);
}

/**
 * Clear the cache for a specific directory, or wipe everything.
 * Use in tests and in watch-mode file-change handlers.
 */
export function clearCache(directory?: string): void {
  if (directory !== undefined) {
    _cache.delete(directory);
  } else {
    _cache.clear();
  }
}
