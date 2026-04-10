import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { app } from '@illumiarq/core';

export type { LibSQLDatabase };

/** Connection options for the database factory. */
export interface ConnectionOptions {
  /** Driver */
  driver?: string;
  /** libsql connection URL. Use ":memory:" for tests. */
  url: string;
  /** Auth token for remote libsql connections (e.g. Turso). */
  authToken?: string;
  /**
   * Enable Drizzle query logging.
   * Defaults to true when APP_ENV=local (app().isLocal()), false otherwise.
   * Pass `logger: false` to disable explicitly even in local mode.
   */
  logger?: boolean;
}

/** The connection factory result — a Drizzle ORM instance. */
export type DatabaseConnection = LibSQLDatabase;

/**
 * Creates a Drizzle ORM database connection via libsql.
 * Query logging is enabled automatically when APP_ENV=local.
 * Use `url: ':memory:'` in tests for zero-infrastructure SQLite.
 * Use `url: process.env.DATABASE_URL` in application code (via env.ts only).
 *
 * @param options - Connection options
 * @returns A Drizzle ORM database instance
 */
export function createConnection(options: ConnectionOptions): DatabaseConnection {
  // Conditionally include authToken — exactOptionalPropertyTypes requires omitting the key (not passing undefined).
  const client: Client = createClient({
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
