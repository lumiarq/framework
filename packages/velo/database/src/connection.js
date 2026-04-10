import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { app } from '@velo/core';
/**
 * Creates a Drizzle ORM database connection via libsql.
 * Query logging is enabled automatically when APP_ENV=local.
 * Use `url: ':memory:'` in tests for zero-infrastructure SQLite.
 * Use `url: process.env.DATABASE_URL` in application code (via env.ts only).
 *
 * @param options - Connection options
 * @returns A Drizzle ORM database instance
 */
export function createConnection(options) {
  // Conditionally include authToken — exactOptionalPropertyTypes requires omitting the key (not passing undefined).
  const client = createClient({
    url: options.url,
    ...(options.authToken !== undefined && { authToken: options.authToken }),
  });
  // Enable Drizzle query logging in local development.
  // options.logger takes precedence; falls back to app().isLocal().
  let enableLogger = options.logger;
  if (enableLogger === undefined) {
    try {
      enableLogger = app().isLocal();
    } catch {
      enableLogger = false; // safe default when app() hasn't bootstrapped yet (e.g. in tests)
    }
  }
  return drizzle(client, { logger: enableLogger });
}
//# sourceMappingURL=connection.js.map
