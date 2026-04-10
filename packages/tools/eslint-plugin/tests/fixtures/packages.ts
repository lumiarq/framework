/**
 * Shared package name constants for ESLint plugin tests.
 * Update here — all test files derive their strings from these.
 */

/** The one public meta-package apps should always import from. */
export const FRAMEWORK = '@lumiarq/framework';

/** Internal @illumiarq/* packages — must never be imported directly by app code. */
export const PKG = {
  core: '@illumiarq/core',
  runtime: '@illumiarq/runtime',
  database: '@illumiarq/database',
  migrations: '@illumiarq/migrations',
  adapters: '@illumiarq/adapters',
  build: '@illumiarq/build',
  auth: '@illumiarq/auth',
  authStarter: '@illumiarq/auth-starter',
  support: '@illumiarq/support',
  query: '@illumiarq/query',
  veil: '@illumiarq/veil',
  contracts: '@illumiarq/contracts',
  security: '@illumiarq/security',
  search: '@illumiarq/search',
  context: '@illumiarq/context',
  modules: '@illumiarq/modules',
  cache: '@illumiarq/cache',
  testing: '@illumiarq/testing',
  tinker: '@illumiarq/tinker',
} as const;
