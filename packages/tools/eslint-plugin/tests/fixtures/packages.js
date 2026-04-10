/**
 * Shared package name constants for ESLint plugin tests.
 * Update here — all test files derive their strings from these.
 */
/** The one public meta-package apps should always import from. */
export const FRAMEWORK = '@lumiarq/framework';
/** Internal @velo/* packages — must never be imported directly by app code. */
export const PKG = {
  core: '@illumiarqcore',
  runtime: '@illumiarqruntime',
  database: '@illumiarqdatabase',
  migrations: '@illumiarqmigrations',
  adapters: '@illumiarqadapters',
  build: '@illumiarqbuild',
  auth: '@illumiarqauth',
  authStarter: '@illumiarqauth-starter',
  support: '@illumiarqsupport',
  query: '@illumiarqquery',
  veil: '@illumiarqveil',
  contracts: '@illumiarqcontracts',
  security: '@illumiarqsecurity',
  search: '@illumiarqsearch',
  context: '@illumiarqcontext',
  modules: '@illumiarqmodules',
  cache: '@illumiarqcache',
  testing: '@illumiarqtesting',
  tinker: '@illumiarqtinker',
};
//# sourceMappingURL=packages.js.map
