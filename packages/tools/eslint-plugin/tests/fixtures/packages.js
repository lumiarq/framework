/**
 * Shared package name constants for ESLint plugin tests.
 * Update here — all test files derive their strings from these.
 */
/** The one public meta-package apps should always import from. */
export const FRAMEWORK = '@lumiarq/framework';
/** Internal @velo/* packages — must never be imported directly by app code. */
export const PKG = {
  core: '@velo/core',
  runtime: '@velo/runtime',
  database: '@velo/database',
  migrations: '@velo/migrations',
  adapters: '@velo/adapters',
  build: '@velo/build',
  auth: '@velo/auth',
  authStarter: '@velo/auth-starter',
  support: '@velo/support',
  query: '@velo/query',
  veil: '@velo/veil',
  contracts: '@velo/contracts',
  security: '@velo/security',
  search: '@velo/search',
  context: '@velo/context',
  modules: '@velo/modules',
  cache: '@velo/cache',
  testing: '@velo/testing',
  tinker: '@velo/tinker',
};
//# sourceMappingURL=packages.js.map
