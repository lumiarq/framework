/**
 * Wraps a BoundLoader into a plain async thunk.
 * Framework-agnostic — works with any data-fetching library.
 *
 * @param loader - A BoundLoader produced by defineLoader
 * @param input  - Input to the loader (validated by its Zod schema)
 * @returns A thunk: () => Promise<unknown>
 */
export function fetchLoader(loader, input) {
  return () => loader.fetch({ input, deps: new Map() });
}
//# sourceMappingURL=fetch-loader.js.map
