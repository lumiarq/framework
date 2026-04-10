import { getTestTransaction } from '@velo/core';
import { getConnection } from './connection-factory.js';
/**
 * Abstract base repository providing shared query infrastructure.
 * Extend this class — NEVER modify it (OCP).
 *
 * ### Transaction-aware `db` getter
 *
 * When running inside `withTestContext()`, `this.db` transparently returns the
 * test transaction connection for this repository's named connection. This enables
 * atomic test isolation across nested repository calls without any test-specific
 * code in the repository itself.
 *
 * Outside tests, `this.db` calls `getConnection(this.connection)` which uses the
 * config registered by `setConnectionConfig()` in `bootstrap/providers.ts`.
 *
 * Override `connection` in subclasses to use a non-default database connection:
 * ```ts
 * class AnalyticsRepository extends BaseRepository<...> {
 *   protected override readonly connection = 'analytics';
 * }
 * ```
 *
 * ### `executeQuery` helper
 *
 * Performs a single ALS lookup per query method. Prefer `executeQuery` over
 * calling `this.db` directly in concrete methods:
 *
 * ```ts
 * findById(id: string) {
 *   return this.executeQuery('findById', () =>
 *     this.db.select(...).from(...).where(...).get()
 *   );
 * }
 * ```
 *
 * @template TModel - The domain model type
 * @template TCreateInput - Input for creation
 * @template TUpdateInput - Input for updates
 */
export class BaseRepository {
  /**
   * The connection name this repository uses.
   * Override in subclasses for non-default database connections.
   * Must match the key in `config/database.ts` connections map.
   */
  connection = 'default';
  /**
   * Returns the active database connection.
   *
   * - Inside `withTestContext()`: returns the transaction connection for
   *   `this.connection` so all queries participate in the test transaction
   *   and are rolled back after.
   * - Otherwise: returns the connection registered via `setConnectionConfig()`
   *   for `this.connection`.
   */
  get db() {
    const testDb = getTestTransaction(this.connection);
    return testDb ?? getConnection(this.connection);
  }
  maxPerPage = 100;
  /**
   * Executes a database query using the active connection (transaction-aware).
   *
   * Prefer this over calling `this.db` directly — it performs a single ALS
   * lookup per method call. The `fn` closure captures `this.db` so it resolves
   * the connection only once per call.
   *
   * @param queryName - Logical name of the query (used for logging in dev mode)
   * @param fn        - Zero-argument closure that performs the query using `this.db`
   */
  executeQuery(queryName, fn) {
    return fn();
  }
  /**
   * Clamps a query limit to prevent unbounded queries.
   */
  clampLimit(requested, max = 100) {
    if (requested === undefined) return max;
    return Math.min(requested, max);
  }
  /**
   * Offset-based pagination — accepts raw arrays (works with any Drizzle query result).
   */
  paginate(items, total, options) {
    const perPage = Math.min(Math.max(1, options.perPage), this.maxPerPage);
    const page = Math.max(1, options.page);
    const lastPage = Math.ceil(total / perPage);
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    return { data: items, total, page, perPage, lastPage, from, to };
  }
  /**
   * Cursor-based pagination — encodes/decodes opaque base64 cursor.
   */
  cursorPaginate(items, getCursorId, options) {
    const limit = Math.min(Math.max(1, options.limit), this.maxPerPage);
    const data = items.slice(0, limit);
    const hasMore = items.length > limit;
    const nextCursor =
      hasMore && data.length > 0
        ? Buffer.from(getCursorId(data[data.length - 1])).toString('base64')
        : null;
    const prevCursor = options.cursor
      ? Buffer.from(getCursorId(data[0]) ?? '').toString('base64')
      : null;
    return { data, nextCursor, prevCursor, hasMore };
  }
}
//# sourceMappingURL=base-repository.js.map
