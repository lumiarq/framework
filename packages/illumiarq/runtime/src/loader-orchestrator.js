import stringify from 'fast-json-stable-stringify';
import { LoaderDependencyError } from '@illumiarqhttp';
/**
 * Creates an empty request-scoped deduplication cache.
 * One cache per request; never shared across requests.
 */
export function createRequestCache() {
  const store = new Map();
  return {
    get: (key) => store.get(key),
    set: (key, p) => {
      store.set(key, p);
    },
  };
}
// ─── Cycle detection ─────────────────────────────────────────────────────────
/**
 * Performs a depth-first traversal of the loader dependency graph.
 * Throws `LoaderDependencyError` immediately if a cycle is found.
 *
 * @param loader    - The loader being visited
 * @param visiting  - Set of loader IDs currently on the DFS stack
 * @param visited   - Set of loader IDs already fully explored (no cycle from them)
 * @param path      - Current DFS path for human-readable error messages
 */
function detectCyclesDFS(loader, visiting, visited, path) {
  if (visited.has(loader.id)) return;
  if (visiting.has(loader.id)) {
    const cycle = [...path, loader.id].join(' → ');
    throw new LoaderDependencyError(cycle);
  }
  visiting.add(loader.id);
  path.push(loader.id);
  for (const dep of loader.dependsOn ?? []) {
    detectCyclesDFS(dep, visiting, visited, path);
  }
  path.pop();
  visiting.delete(loader.id);
  visited.add(loader.id);
}
/**
 * Validates that the dependency graph across all loaders for a route is acyclic.
 * Called before any loader executes — throws immediately on detection.
 *
 * @throws {LoaderDependencyError} if any circular dependency is detected
 */
function assertAcyclic(loaders) {
  const visiting = new Set();
  const visited = new Set();
  for (const loader of loaders) {
    detectCyclesDFS(loader, visiting, visited, []);
  }
}
// ─── Orchestration ────────────────────────────────────────────────────────────
/**
 * Executes a set of loaders with four guarantees:
 *
 * 1. **Acyclic validation** — circular `dependsOn` graphs throw `LoaderDependencyError`
 *    before any loader runs.
 *
 * 2. **Parallel execution** — independent (root) loaders run concurrently via
 *    `Promise.all`. Total time ≈ slowest loader, not the sum.
 *
 * 3. **Request-scoped deduplication** — same loader + same input within one request
 *    yields a single execution. Dedup key is `fast-json-stable-stringify` to
 *    guarantee property-order stability.
 *
 * 4. **Dependency ordering** — `dependsOn` loaders are awaited before dependent
 *    loaders run. Dependencies of the same loader run in parallel.
 *
 * @param loaders - Loaders registered for this route
 * @param input   - Input map, keyed by loader id
 * @param cache   - Request-scoped deduplication cache (pass `createRequestCache()`)
 * @returns       Map of loader id → resolved data
 *
 * @throws {LoaderDependencyError} on circular dependency
 */
export async function orchestrateLoaders(loaders, input, cache) {
  // Guard: validate DAG before touching any loader
  assertAcyclic(loaders);
  const results = new Map();
  /**
   * Runs a single loader through the deduplication cache.
   * Uses fast-json-stable-stringify so { b:1, a:2 } and { a:2, b:1 } produce
   * the same cache key.
   */
  async function runLoader(loader) {
    // Stable serialisation for property-order-independent dedup
    const key = `${loader.id}:${stringify(input[loader.id] ?? {})}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const promise = (async () => {
      // Resolve all dependsOn concurrently (they will self-deduplicate via cache)
      const deps = new Map();
      await Promise.all(
        (loader.dependsOn ?? []).map(async (dep) => {
          deps.set(dep.id, await runLoader(dep));
        }),
      );
      return loader.fetch({ input: input[loader.id], deps });
    })();
    cache.set(key, promise);
    return promise;
  }
  // Execute all loaders in parallel; dependsOn ordering is self-managing via runLoader
  await Promise.all(
    loaders.map(async (loader) => {
      results.set(loader.id, await runLoader(loader));
    }),
  );
  return results;
}
//# sourceMappingURL=loader-orchestrator.js.map
