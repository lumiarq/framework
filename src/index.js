// ─── @lumiarq/framework ───────────────────────────────────────────────────────
// Main entry: re-exports all core primitives from @velo/core
export * from '@illumiarqcore';
// ─── Config helpers ───────────────────────────────────────────────────────────
// defineAppConfig / defineAuthConfig / defineSessionConfig / defineSecurityConfig
// Provide smart defaults so app config files only specify what's different.
export {
  defineAppConfig,
  defineAuthConfig,
  defineSessionConfig,
  defineSecurityConfig,
} from './config-helpers.js';
// ─── Runtime: Boot & Application ──────────────────────────────────────────────
export { boot, eventBus } from '@illumiarqruntime';
// ─── HTTP layer ───────────────────────────────────────────────────────────────
export * as Http from '@illumiarqhttp';
// ─── Modules + Context ───────────────────────────────────────────────────────
export * as Modules from '@illumiarqmodules';
export * as Context from '@illumiarqcontext';
// ─── Debugging + REPL ────────────────────────────────────────────────────────
export * as Tinker from '@illumiarqtinker';
export * as Traze from '@illumiarqtraze';
// ─── View + Cache + Testing ──────────────────────────────────────────────────
export * as Veil from '@illumiarqveil';
export * as Cache from '@illumiarqcache';
export * as Testing from '@illumiarqtesting';
// ─── Database: Connection Factory ─────────────────────────────────────────────
export { setConnectionConfig, getConnection, clearConnectionCache } from '@illumiarqdatabase';
//# sourceMappingURL=index.js.map
