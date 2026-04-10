import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * ALS store for test transaction database connections.
 * Stores a map of connection-name → transaction connection.
 *
 * Set by `withTestContext()` in `@velo/runtime`.
 * Read by `BaseRepository.db` getter in `@velo/database`.
 *
 * Typed as `Record<string, unknown>` to keep `@velo/core` free of any ORM
 * dependency. Callers cast to the concrete database type after reading.
 */
const testTransactionStore = new AsyncLocalStorage<Record<string, unknown>>();

/**
 * Returns the active test transaction connection for the given connection name,
 * or `undefined` when called outside a `withTestContext()` scope or when the
 * named connection was not opened.
 *
 * Used by `BaseRepository.db` getter to swap in the transaction connection.
 *
 * @param connection - The connection name to look up (default: 'default')
 */
export function getTestTransaction(connection = 'default'): unknown {
  return testTransactionStore.getStore()?.[connection];
}

/**
 * Returns whether the current scope is a test transaction scope.
 * Used to check if we're inside `withTestContext()` at all.
 */
export function isInTestTransaction(): boolean {
  return testTransactionStore.getStore() !== undefined;
}

/**
 * Runs `fn` with the given connection map bound to the test transaction ALS.
 * Called internally by `withTestContext()`.
 *
 * @param dbMap - Map of connection-name → transaction connection
 * @param fn    - The function to run inside the transaction scope
 */
export function runWithTestTransaction<T>(dbMap: Record<string, unknown>, fn: () => T): T {
  return testTransactionStore.run(dbMap, fn);
}
