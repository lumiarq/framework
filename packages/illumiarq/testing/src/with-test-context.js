import { runWithTestTransaction } from '@illumiarqcore';
import { createTestContext, runWithContext } from '@illumiarqcontext';
/** Internal sentinel — thrown to force rollback without swallowing real errors. */
class TestRollbackSentinel extends Error {
  constructor() {
    super('TEST_ROLLBACK_SENTINEL');
    this.name = 'TestRollbackSentinel';
  }
}
/**
 * Runs a test function inside a fully-isolated execution context, optionally
 * wrapped in auto-rolled-back database transactions.
 *
 * Returns `() => Promise<T>` so it can be passed directly to Vitest's `it()`:
 *
 * ```ts
 * it('creates a user', withTestContext({ db: { default: db } }, async () => {
 *   const repo = new UserRepository(db); // uses transaction automatically
 *   const user = await repo.create({ email: 'test@example.com' });
 *   expect(user.email).toBe('test@example.com');
 *   // Database is rolled back automatically after this function returns.
 * }));
 * ```
 *
 * ### Invariant 139
 * `withTestContext()` must be the **outermost** wrapper in any test — never nest
 * `withTestContext()` calls. Nesting opens duplicate transactions which conflict.
 *
 * @param overrides - Optional test context overrides (db connections, locale, testId)
 * @param fn        - The test body
 * @returns         A zero-argument async function suitable for `it(name, fn)`
 */
export function withTestContext(overrides, fn) {
  return async () => {
    const ctx = createTestContext({
      ...(overrides.testId !== undefined && { testId: overrides.testId }),
      ...(overrides.locale !== undefined && { locale: overrides.locale }),
    });
    const dbEntries = Object.entries(overrides.db ?? {});
    // No DB connections — run with context only, no transaction wrapping
    if (dbEntries.length === 0) {
      return runWithContext(ctx, () => Promise.resolve(fn()));
    }
    // Open nested transactions for each connection, run fn, always roll back all
    return openNestedTransactions(dbEntries, {}, (txMap) =>
      runWithTestTransaction(txMap, () => runWithContext(ctx, () => Promise.resolve(fn()))),
    );
  };
}
/**
 * Recursively opens a transaction for each entry in `remaining`, then calls
 * `fn` with the fully-populated `txMap`. After `fn` resolves (or throws), all
 * transactions are unconditionally rolled back via the sentinel strategy.
 */
async function openNestedTransactions(remaining, txMap, fn) {
  if (remaining.length === 0) {
    return fn(txMap);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [[name, db], ...rest] = remaining;
  let result;
  let fnError;
  let fnCompleted = false;
  try {
    await db.transaction(async (trx) => {
      try {
        result = await openNestedTransactions(rest, { ...txMap, [name]: trx }, fn);
        fnCompleted = true;
      } catch (err) {
        fnError = err;
      }
      // Always roll back — throw sentinel regardless of fn outcome
      throw new TestRollbackSentinel();
    });
  } catch (err) {
    if (!(err instanceof TestRollbackSentinel)) {
      // Unexpected error from db.transaction() itself — rethrow
      throw err;
    }
    // Sentinel caught — rollback succeeded
  }
  if (!fnCompleted) throw fnError;
  return result;
}
//# sourceMappingURL=with-test-context.js.map
