// ─── @lumiarq/framework ───────────────────────────────────────────────────────
// Main entry: re-exports all core primitives from @velo/core
export * from '@velo/core';
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
export { boot, eventBus } from '@velo/runtime';
// ─── HTTP layer ───────────────────────────────────────────────────────────────
export * as Http from '@velo/http';
// ─── Modules + Context ───────────────────────────────────────────────────────
export * as Modules from '@velo/modules';
export * as Context from '@velo/context';
// ─── Debugging + REPL ────────────────────────────────────────────────────────
export * as Tinker from '@velo/tinker';
export * as Traze from '@velo/traze';
// ─── View + Cache + Testing ──────────────────────────────────────────────────
export * as Veil from '@velo/veil';
export * as Cache from '@velo/cache';
export * as Testing from '@velo/testing';
// ─── Database: Connection Factory ─────────────────────────────────────────────
export { setConnectionConfig, getConnection, clearConnectionCache } from '@velo/database';
//# sourceMappingURL=index.js.map
